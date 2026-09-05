"""
Pipeline Orchestrator Module.
Wires together Classify ➔ Policy Gate ➔ Diagnose ➔ Intervene ➔ DB Persistence & Outcomes.
Processes single cases and full batches with full audit trail storage in SQLite.
"""

import random
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.db import (
    Case,
    DiagnosisRecord,
    PolicyDecision,
    InterventionRecord,
    Outcome,
)
from app.pipeline.classify import classify_error
from app.pipeline.policy import evaluate_policy
from app.pipeline.diagnose import diagnose_case
from app.pipeline.intervene import execute_intervention


def _simulate_recovery(action: str, failure_class: str) -> bool:
    """Simulates realistic recovery likelihood based on policy action and failure class."""
    if action not in ["retry", "nudge"]:
        return False

    probs = {
        "network_error": 0.85,
        "insufficient_funds": 0.65,
        "card_expired": 0.50,
        "bank_declined": 0.45,
        "other": 0.40,
    }
    prob = probs.get(failure_class, 0.40)
    return random.random() < prob


def process_case(
    case_data: dict,
    db: Session,
    config_overrides: Optional[dict] = None,
    batch_id: Optional[str] = None
) -> dict:
    """
    Processes a single payment failure case through the end-to-end recovery pipeline:
    1. Classify error
    2. Evaluate policy rules
    3. Diagnose root cause
    4. Execute intervention / payment link creation
    5. Save full audit trail to database
    """
    # Step 1: Classify Error
    failure_class = classify_error(
        case_data.get("error_code", ""),
        case_data.get("error_description", "")
    )
    case_data["failure_class"] = failure_class

    # Step 2: Evaluate Policy
    policy_res = evaluate_policy(case_data, config_overrides)

    # Step 3: Diagnose Root Cause
    diag_res = diagnose_case(case_data)

    # Step 4: Execute Intervention
    interv_res = execute_intervention(case_data, policy_res)

    # Step 5: Simulate Recovery Outcome
    action = policy_res["action"]
    is_recovered = _simulate_recovery(action, failure_class)
    amount = float(case_data.get("amount", 0.0))

    if is_recovered:
        case_status = "recovered"
        outcome_status = "recovered"
        recovered_amount = amount
    elif action == "escalate":
        case_status = "review_required"
        outcome_status = "pending"
        recovered_amount = 0.0
    elif action == "waive":
        case_status = "abandoned"
        outcome_status = "abandoned"
        recovered_amount = 0.0
    else:
        case_status = "in_progress"
        outcome_status = "pending"
        recovered_amount = 0.0

    # DB Persistence
    case_id = case_data["id"]

    # Delete existing case audit trail if re-processing
    existing_case = db.query(Case).filter(Case.id == case_id).first()
    if existing_case:
        db.delete(existing_case)
        db.flush()

    # Create Case ORM object
    case_obj = Case(
        id=case_id,
        customer_id=case_data.get("customer_id", f"cust_{case_id[:6]}"),
        customer_name=case_data.get("customer_name", "Valued Customer"),
        customer_email=case_data.get("customer_email", "customer@example.com"),
        customer_phone=case_data.get("customer_phone", "+919999999999"),
        is_dnd=bool(case_data.get("is_dnd", False)),
        amount=amount,
        currency=case_data.get("currency", "INR"),
        payment_mode=case_data.get("payment_mode", "card"),
        error_code=case_data.get("error_code", "UNKNOWN_ERROR"),
        error_description=case_data.get("error_description", ""),
        failure_class=failure_class,
        attempt_count=int(case_data.get("attempt_count", 1)),
        batch_id=batch_id,
        status=case_status,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(case_obj)
    db.flush()

    # Create DiagnosisRecord ORM object
    diag_obj = DiagnosisRecord(
        case_id=case_id,
        root_cause=diag_res["root_cause"],
        confidence_score=diag_res["confidence_score"],
        explanation=diag_res["explanation"],
        is_fallback=diag_res["is_fallback"],
        raw_llm_response=diag_res.get("raw_llm_response", ""),
        model_name=diag_res.get("model_name", "rule-engine-v1"),
    )
    db.add(diag_obj)

    # Create PolicyDecision ORM object
    policy_obj = PolicyDecision(
        case_id=case_id,
        action=policy_res["action"],
        reason=policy_res["reason"],
        rule_triggered=policy_res["rule_triggered"],
        is_override=policy_res.get("is_override", False),
    )
    db.add(policy_obj)

    # Create InterventionRecord ORM object
    interv_obj = InterventionRecord(
        case_id=case_id,
        channel=interv_res["channel"],
        payment_link_id=interv_res.get("payment_link_id"),
        payment_link_url=interv_res.get("payment_link_url"),
        message_text=interv_res.get("message_text"),
        status=interv_res.get("status", "sent"),
    )
    db.add(interv_obj)

    # Create Outcome ORM object
    outcome_obj = Outcome(
        case_id=case_id,
        status=outcome_status,
        recovered_amount=recovered_amount,
        recovered_at=datetime.utcnow() if is_recovered else None,
        notes=f"Processed via policy action '{action}'",
    )
    db.add(outcome_obj)

    db.commit()

    return {
        "case_id": case_id,
        "customer_name": case_data.get("customer_name"),
        "amount": amount,
        "failure_class": failure_class,
        "action": policy_res["action"],
        "rule_triggered": policy_res["rule_triggered"],
        "diagnosis": diag_res["root_cause"],
        "channel": interv_res["channel"],
        "payment_link_url": interv_res.get("payment_link_url"),
        "status": case_status,
        "recovered_amount": recovered_amount,
    }


def process_batch(
    cases_list: List[dict],
    db: Session,
    config_overrides: Optional[dict] = None
) -> dict:
    """
    Processes a full batch of cases, persisting DB records for each and returning aggregate analytics.
    """
    batch_id = f"batch_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    processed_results = []
    total_revenue_at_risk = 0.0
    total_revenue_recovered = 0.0
    
    action_breakdown = {"retry": 0, "nudge": 0, "escalate": 0, "waive": 0}
    failure_breakdown = {
        "insufficient_funds": 0,
        "bank_declined": 0,
        "network_error": 0,
        "risk_hold": 0,
        "card_expired": 0,
        "other": 0,
    }

    for case_data in cases_list:
        res = process_case(case_data, db, config_overrides, batch_id=batch_id)
        processed_results.append(res)

        total_revenue_at_risk += res["amount"]
        total_revenue_recovered += res["recovered_amount"]

        act = res["action"]
        if act in action_breakdown:
            action_breakdown[act] += 1

        fc = res["failure_class"]
        if fc in failure_breakdown:
            failure_breakdown[fc] += 1
        else:
            failure_breakdown["other"] += 1

    total_cases = len(cases_list)
    recovery_rate = (total_revenue_recovered / total_revenue_at_risk * 100) if total_revenue_at_risk > 0 else 0.0

    return {
        "batch_id": batch_id,
        "total_cases": total_cases,
        "total_revenue_at_risk": total_revenue_at_risk,
        "total_revenue_recovered": total_revenue_recovered,
        "recovery_rate_percent": round(recovery_rate, 2),
        "action_breakdown": action_breakdown,
        "failure_breakdown": failure_breakdown,
        "cases": processed_results,
    }
