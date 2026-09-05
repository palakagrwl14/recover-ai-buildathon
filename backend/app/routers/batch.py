from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db import (
    Case,
    DiagnosisRecord,
    PolicyDecision,
    InterventionRecord,
    Outcome,
    PolicyConfig,
    PolicyChangeLog,
)
from app.schemas import (
    BatchRunRequest,
    PolicyConfigUpdate,
    CaseSummary,
    CaseDetailResponse,
    DiagnosisDetail,
    PolicyDecisionDetail,
    InterventionDetail,
    OutcomeDetail,
    BatchSummaryResponse,
)
from app.synthetic import generate_synthetic_cases
from app.pipeline.orchestrator import process_batch

router = APIRouter(prefix="/api", tags=["Batch & Cases"])


@router.post("/batch/run", response_model=dict)
def run_batch(
    payload: BatchRunRequest = BatchRunRequest(),
    db: Session = Depends(get_db)
):
    """
    Triggers a batch payment recovery run on synthetic cases.
    Stores complete audit trails in the database and returns aggregate execution results.
    """
    cases = generate_synthetic_cases(count=payload.count)
    result = process_batch(cases, db, config_overrides=payload.config_overrides)
    return result


@router.get("/batches", response_model=List[dict])
def list_batches(db: Session = Depends(get_db)):
    """
    Returns list of processed execution batch IDs with timestamp, total case count, recovery rate %, amount recovered, and policy version.
    """
    results = (
        db.query(
            Case.batch_id,
            func.min(Case.created_at).label("created_at"),
            func.count(Case.id).label("total_cases"),
            func.sum(Case.amount).label("total_amount_at_risk")
        )
        .filter(Case.batch_id.isnot(None))
        .group_by(Case.batch_id)
        .order_by(func.min(Case.created_at).desc())
        .all()
    )
    if not results:
        all_cases = db.query(Case).all()
        if all_cases:
            min_time = min(c.created_at for c in all_cases)
            return [{
                "batch_id": "batch_default",
                "created_at": min_time.isoformat(),
                "total_cases": len(all_cases),
                "amount_recovered": 0.0,
                "recovery_rate_pct": 0.0,
                "policy_version": "v1.0 Standard"
            }]
        return []

    batch_list = []
    for idx, r in enumerate(results):
        batch_id = r.batch_id
        cases_in_batch = db.query(Case.id).filter(Case.batch_id == batch_id).all()
        c_ids = [c[0] for c in cases_in_batch]
        
        outcomes = db.query(Outcome).filter(Outcome.case_id.in_(c_ids)).all() if c_ids else []
        amt_recovered = sum(o.recovered_amount for o in outcomes if o.recovered_amount)
        amt_risk = float(r.total_amount_at_risk or 0.0)
        rec_rate = (amt_recovered / amt_risk * 100.0) if amt_risk > 0 else 0.0

        # Policy version identifier e.g. v1.2 (Active Ruleset)
        policy_ver = f"v1.{max(1, len(results) - idx)}"

        batch_list.append({
            "batch_id": batch_id,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "total_cases": r.total_cases,
            "amount_recovered": round(amt_recovered, 2),
            "total_amount_at_risk": round(amt_risk, 2),
            "recovery_rate_pct": round(rec_rate, 1),
            "recovery_rate_percent": round(rec_rate, 1),
            "policy_version": policy_ver
        })

    return batch_list


@router.get("/batch/summary", response_model=BatchSummaryResponse)
def get_batch_summary(
    batch_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
):
    """
    Returns live summary metrics across processed cases in the database.
    """
    query = db.query(Case)
    if batch_id and batch_id != "all" and batch_id != "batch_default":
        query = query.filter(Case.batch_id == batch_id)

    cases = query.all()
    if not cases:
        return BatchSummaryResponse(
            total_cases=0,
            total_revenue_at_risk=0.0,
            total_revenue_recovered=0.0,
            recovery_rate_percent=0.0,
            cases_blocked=0,
            cases_escalated=0,
            cases_recovered=0,
            cases_pending=0,
            action_breakdown={"retry": 0, "nudge": 0, "escalate": 0, "waive": 0},
            failure_breakdown={
                "insufficient_funds": 0,
                "bank_declined": 0,
                "network_error": 0,
                "risk_hold": 0,
                "card_expired": 0,
                "other": 0,
            },
        )

    case_ids = [c.id for c in cases]
    total_cases = len(cases)
    total_revenue_at_risk = sum(c.amount for c in cases)
    
    outcomes = db.query(Outcome).filter(Outcome.case_id.in_(case_ids)).all() if case_ids else []
    total_revenue_recovered = sum(o.recovered_amount for o in outcomes)

    recovery_rate_percent = (total_revenue_recovered / total_revenue_at_risk * 100) if total_revenue_at_risk > 0 else 0.0

    cases_blocked = sum(1 for c in cases if c.is_dnd or c.status == "abandoned")
    cases_escalated = sum(1 for c in cases if c.status == "review_required")
    cases_recovered = sum(1 for c in cases if c.status == "recovered")
    cases_pending = sum(1 for c in cases if c.status == "in_progress" or c.status == "pending")

    action_breakdown = {"retry": 0, "nudge": 0, "escalate": 0, "waive": 0}
    policy_decisions = db.query(PolicyDecision).filter(PolicyDecision.case_id.in_(case_ids)).all() if case_ids else []
    for pd in policy_decisions:
        act = pd.action.lower()
        if act in action_breakdown:
            action_breakdown[act] += 1

    failure_breakdown = {
        "insufficient_funds": 0,
        "bank_declined": 0,
        "network_error": 0,
        "risk_hold": 0,
        "card_expired": 0,
        "other": 0,
    }
    for c in cases:
        fc = c.failure_class.lower()
        if fc in failure_breakdown:
            failure_breakdown[fc] += 1
        else:
            failure_breakdown["other"] += 1

    return BatchSummaryResponse(
        total_cases=total_cases,
        total_revenue_at_risk=round(total_revenue_at_risk, 2),
        total_revenue_recovered=round(total_revenue_recovered, 2),
        recovery_rate_percent=round(recovery_rate_percent, 2),
        cases_blocked=cases_blocked,
        cases_escalated=cases_escalated,
        cases_recovered=cases_recovered,
        cases_pending=cases_pending,
        action_breakdown=action_breakdown,
        failure_breakdown=failure_breakdown,
    )


@router.get("/cases", response_model=List[dict])
def list_cases(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    failure_class_filter: Optional[str] = Query(default=None, alias="failure_class"),
    batch_id_filter: Optional[str] = Query(default=None, alias="batch_id"),
    db: Session = Depends(get_db),
):
    """
    Returns a paginated list of cases with optional status, failure_class, and batch_id filtering.
    """
    query = db.query(Case)
    if status_filter and status_filter.lower() != "all":
        query = query.filter(Case.status == status_filter)
    if failure_class_filter and failure_class_filter.lower() != "all":
        query = query.filter(Case.failure_class == failure_class_filter)
    if batch_id_filter and batch_id_filter.lower() != "all":
        query = query.filter(Case.batch_id == batch_id_filter)

    cases = query.order_by(Case.created_at.desc()).offset(offset).limit(limit).all()
    
    # Map rich summary info for table view
    results = []
    for c in cases:
        pd = db.query(PolicyDecision).filter(PolicyDecision.case_id == c.id).first()
        interv = db.query(InterventionRecord).filter(InterventionRecord.case_id == c.id).first()
        outc = db.query(Outcome).filter(Outcome.case_id == c.id).first()

        # Gate result: blocked if DND or action is waive/blocked, allowed otherwise
        allowed = not c.is_dnd and (pd is None or pd.action.lower() != "waive")

        results.append({
            "id": c.id,
            "case_id": c.id,
            "customer_name": c.customer_name,
            "customer_email": c.customer_email,
            "amount": c.amount,
            "currency": c.currency,
            "payment_mode": c.payment_mode,
            "failure_class": c.failure_class,
            "error_code": c.error_code,
            "attempt_count": c.attempt_count,
            "status": c.status,
            "is_dnd": c.is_dnd,
            "batch_id": c.batch_id,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "policy_decisions": [{
                "allowed": allowed,
                "action": pd.action if pd else "none",
                "reason": pd.reason if pd else "Standard policy evaluation",
                "rule_triggered": pd.rule_triggered if pd else "RULE_DEFAULT"
            }] if pd else [{"allowed": allowed, "action": "none", "reason": "DND Blocked" if c.is_dnd else "Default policy", "rule_triggered": "RULE_DEFAULT"}],
            "interventions": [{
                "action_type": interv.channel if interv else "none",
                "channel": interv.channel if interv else "none",
                "content": interv.message_text if interv else None,
                "external_ref": interv.payment_link_url if interv else None,
                "payment_link_url": interv.payment_link_url if interv else None,
            }] if interv else [],
            "outcome": {
                "outcome": outc.status if outc else c.status,
                "status": outc.status if outc else c.status,
                "amount_recovered": outc.recovered_amount if outc else 0.0,
                "recovered_amount": outc.recovered_amount if outc else 0.0,
            } if outc else None,
        })

    return results


@router.get("/cases/{case_id}", response_model=CaseDetailResponse)
def get_case_detail(case_id: str, db: Session = Depends(get_db)):
    """
    Returns full audit trail for a single case: Case info, Diagnosis, Policy Decision, Interventions, Outcome.
    """
    case_obj = db.query(Case).filter(Case.id == case_id).first()
    if not case_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID '{case_id}' not found."
        )

    diagnosis = db.query(DiagnosisRecord).filter(DiagnosisRecord.case_id == case_id).first()
    policy_decision = db.query(PolicyDecision).filter(PolicyDecision.case_id == case_id).first()
    interventions = db.query(InterventionRecord).filter(InterventionRecord.case_id == case_id).all()
    outcome = db.query(Outcome).filter(Outcome.case_id == case_id).first()

    policy_detail = None
    if policy_decision:
        policy_detail = PolicyDecisionDetail.model_validate(policy_decision)
        policy_detail.allowed = not case_obj.is_dnd and policy_decision.action.lower() != "waive"

    return CaseDetailResponse(
        case=CaseSummary.model_validate(case_obj),
        diagnosis=DiagnosisDetail.model_validate(diagnosis) if diagnosis else None,
        policy_decision=policy_detail,
        interventions=[InterventionDetail.model_validate(i) for i in interventions],
        outcome=OutcomeDetail.model_validate(outcome) if outcome else None,
    )


@router.get("/policy/config", response_model=dict)
def get_policy_config(db: Session = Depends(get_db)):
    """
    Returns currently stored active policy configuration overrides with defaults.
    """
    configs = db.query(PolicyConfig).all()
    defaults = {
        "max_attempts": "3",
        "cooldown_insufficient_funds": "24",
        "cooldown_bank_declined": "12",
        "cooldown_network_error": "1",
        "cooldown_card_expired": "72",
        "cooldown_other": "24",
        "high_value_threshold": "5000",
        "strict_dnd": "true",
        "risk_hold_auto_retry": "false",
    }
    db_configs = {c.key: c.value for c in configs}
    return {**defaults, **db_configs}


@router.put("/policy/config", response_model=dict)
def update_policy_config(
    payload: dict,
    db: Session = Depends(get_db)
):
    """
    Updates policy engine rules dynamically and logs change audit.
    """
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No configuration parameters provided for update."
        )

    updated_keys = {}
    for key, value in payload.items():
        if value is None:
            continue
        val_str = str(value)
        
        cfg = db.query(PolicyConfig).filter(PolicyConfig.key == key).first()
        old_val = cfg.value if cfg else None
        
        if cfg:
            cfg.value = val_str
            cfg.updated_at = datetime.utcnow()
        else:
            cfg = PolicyConfig(key=key, value=val_str, description=f"Policy setting for {key}")
            db.add(cfg)

        # Record Audit Log
        log = PolicyChangeLog(
            config_key=key,
            old_value=old_val,
            new_value=val_str,
            changed_by="admin_api",
            changed_at=datetime.utcnow()
        )
        db.add(log)
        updated_keys[key] = val_str

    db.commit()
    return {"message": "Policy configuration updated successfully.", "updated": updated_keys}


@router.get("/policy/history", response_model=List[dict])
def get_policy_history(db: Session = Depends(get_db)):
    """
    Returns full audit trail for policy configuration changes.
    """
    logs = db.query(PolicyChangeLog).order_by(PolicyChangeLog.changed_at.desc()).all()
    return [
        {
            "id": log.id,
            "config_key": log.config_key,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "changed_by": log.changed_by,
            "changed_at": log.changed_at.isoformat() if log.changed_at else None,
        }
        for log in logs
    ]


@router.get("/policy/logs", response_model=List[dict])
def get_policy_logs(db: Session = Depends(get_db)):
    return get_policy_history(db)
