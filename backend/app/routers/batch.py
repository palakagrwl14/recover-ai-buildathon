from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
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


@router.get("/batch/summary", response_model=BatchSummaryResponse)
def get_batch_summary(db: Session = Depends(get_db)):
    """
    Returns live summary metrics across all processed cases in the database.
    """
    cases = db.query(Case).all()
    if not cases:
        return BatchSummaryResponse(
            total_cases=0,
            total_revenue_at_risk=0.0,
            total_revenue_recovered=0.0,
            recovery_rate_percent=0.0,
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

    total_cases = len(cases)
    total_revenue_at_risk = sum(c.amount for c in cases)
    
    outcomes = db.query(Outcome).all()
    total_revenue_recovered = sum(o.recovered_amount for o in outcomes)

    recovery_rate_percent = (total_revenue_recovered / total_revenue_at_risk * 100) if total_revenue_at_risk > 0 else 0.0

    action_breakdown = {"retry": 0, "nudge": 0, "escalate": 0, "waive": 0}
    policy_decisions = db.query(PolicyDecision).all()
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
        action_breakdown=action_breakdown,
        failure_breakdown=failure_breakdown,
    )


@router.get("/cases", response_model=List[CaseSummary])
def list_cases(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    failure_class_filter: Optional[str] = Query(default=None, alias="failure_class"),
    db: Session = Depends(get_db),
):
    """
    Returns a paginated list of cases with optional status and failure_class filtering.
    """
    query = db.query(Case)
    if status_filter:
        query = query.filter(Case.status == status_filter)
    if failure_class_filter:
        query = query.filter(Case.failure_class == failure_class_filter)

    cases = query.order_by(Case.created_at.desc()).offset(offset).limit(limit).all()
    return cases


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

    return CaseDetailResponse(
        case=CaseSummary.model_validate(case_obj),
        diagnosis=DiagnosisDetail.model_validate(diagnosis) if diagnosis else None,
        policy_decision=PolicyDecisionDetail.model_validate(policy_decision) if policy_decision else None,
        interventions=[InterventionDetail.model_validate(i) for i in interventions],
        outcome=OutcomeDetail.model_validate(outcome) if outcome else None,
    )


@router.get("/policy/config", response_model=dict)
def get_policy_config(db: Session = Depends(get_db)):
    """
    Returns currently stored active policy configuration overrides.
    """
    configs = db.query(PolicyConfig).all()
    return {c.key: c.value for c in configs}


@router.put("/policy/config", response_model=dict)
def update_policy_config(
    payload: PolicyConfigUpdate,
    db: Session = Depends(get_db)
):
    """
    Updates policy engine rules dynamically and logs change audit.
    """
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No configuration parameters provided for update."
        )

    updated_keys = {}
    for key, value in updates.items():
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
