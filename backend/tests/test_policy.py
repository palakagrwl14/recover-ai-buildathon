import pytest
from app.pipeline.policy import evaluate_policy


def test_risk_hold_always_escalates():
    case_data = {
        "failure_class": "risk_hold",
        "attempt_count": 1,
        "amount": 500.0,
        "is_dnd": False,
    }
    decision = evaluate_policy(case_data)
    assert decision["action"] == "escalate"
    assert decision["rule_triggered"] == "RULE_RISK_HOLD_ESCALATE"


def test_max_retries_exceeded_low_value_waives():
    case_data = {
        "failure_class": "insufficient_funds",
        "attempt_count": 3,
        "amount": 2500.0,
        "is_dnd": False,
    }
    decision = evaluate_policy(case_data, {"max_retries": 3, "high_value_threshold": 10000.0})
    assert decision["action"] == "waive"
    assert decision["rule_triggered"] == "RULE_MAX_RETRIES_WAIVE"


def test_max_retries_exceeded_high_value_escalates():
    case_data = {
        "failure_class": "insufficient_funds",
        "attempt_count": 3,
        "amount": 15000.0,
        "is_dnd": False,
    }
    decision = evaluate_policy(case_data, {"max_retries": 3, "high_value_threshold": 10000.0})
    assert decision["action"] == "escalate"
    assert decision["rule_triggered"] == "RULE_MAX_RETRIES_HIGH_VALUE_ESCALATE"


def test_dnd_compliance_blocks_nudge():
    case_data = {
        "failure_class": "insufficient_funds",
        "attempt_count": 1,
        "amount": 1500.0,
        "is_dnd": True,
    }
    decision = evaluate_policy(case_data, {"strict_dnd": True})
    assert decision["action"] == "retry"
    assert decision["rule_triggered"] == "RULE_INSUFFICIENT_FUNDS_RETRY_DND"


def test_network_error_always_retries():
    case_data = {
        "failure_class": "network_error",
        "attempt_count": 1,
        "amount": 5000.0,
        "is_dnd": False,
    }
    decision = evaluate_policy(case_data)
    assert decision["action"] == "retry"
    assert decision["rule_triggered"] == "RULE_NETWORK_ERROR_RETRY"


def test_determinism():
    """Verify that identical inputs produce identical outputs every single time (100 runs)."""
    case_data = {
        "failure_class": "bank_declined",
        "attempt_count": 1,
        "amount": 8000.0,
        "is_dnd": False,
    }
    first_run = evaluate_policy(case_data)
    for _ in range(100):
        run = evaluate_policy(case_data)
        assert run == first_run
