"""
Policy Gate Module.
Pure deterministic, rule-based decision engine. Zero LLM.
Inputs: case data dictionary, optional config overrides.
Outputs: dict with keys: action (retry|nudge|escalate|waive), rule_triggered, reason, is_override
"""

DEFAULT_CONFIG = {
    "max_retries": 3,
    "high_value_threshold": 10000.0,
    "strict_dnd": True,
}


def evaluate_policy(case_data: dict, config_overrides: dict = None) -> dict:
    """
    Evaluates policy rules for a case deterministically.
    
    case_data fields required/expected:
    - failure_class: str (insufficient_funds, bank_declined, network_error, risk_hold, card_expired, other)
    - attempt_count: int
    - amount: float
    - is_dnd: bool
    """
    # Merge overrides into config
    config = dict(DEFAULT_CONFIG)
    if config_overrides:
        config.update(config_overrides)

    max_retries = int(config.get("max_retries", 3))
    high_value_threshold = float(config.get("high_value_threshold", 10000.0))
    strict_dnd = bool(config.get("strict_dnd", True))

    failure_class = (case_data.get("failure_class") or "other").lower()
    attempt_count = int(case_data.get("attempt_count") or 1)
    amount = float(case_data.get("amount") or 0.0)
    is_dnd = bool(case_data.get("is_dnd", False))

    # -------------------------------------------------------------
    # Rule 1: Security Risk Hold Guardrail (Highest Priority)
    # -------------------------------------------------------------
    if failure_class == "risk_hold":
        return {
            "action": "escalate",
            "rule_triggered": "RULE_RISK_HOLD_ESCALATE",
            "reason": "Risk check failed or fraud suspected. Immediate manual security review required.",
            "is_override": False,
        }

    # -------------------------------------------------------------
    # Rule 2: Max Retries Exceeded Guardrail
    # -------------------------------------------------------------
    if attempt_count >= max_retries:
        if amount >= high_value_threshold:
            return {
                "action": "escalate",
                "rule_triggered": "RULE_MAX_RETRIES_HIGH_VALUE_ESCALATE",
                "reason": f"Exceeded max retries ({attempt_count}/{max_retries}) for high-value case (₹{amount:,.2f}). Escalate to team.",
                "is_override": False,
            }
        else:
            return {
                "action": "waive",
                "rule_triggered": "RULE_MAX_RETRIES_WAIVE",
                "reason": f"Exceeded max retries ({attempt_count}/{max_retries}). Recommend waiving or closing case.",
                "is_override": False,
            }

    # -------------------------------------------------------------
    # Rule 3: Card Expired
    # -------------------------------------------------------------
    if failure_class == "card_expired":
        if is_dnd and strict_dnd:
            return {
                "action": "escalate",
                "rule_triggered": "RULE_CARD_EXPIRED_DND_ESCALATE",
                "reason": "Card expired but customer is on DND. Escalate for alternative compliant outreach.",
                "is_override": False,
            }
        return {
            "action": "nudge",
            "rule_triggered": "RULE_CARD_EXPIRED_NUDGE",
            "reason": "Card expired. Nudge customer with link to update card details.",
            "is_override": False,
        }

    # -------------------------------------------------------------
    # Rule 4: Insufficient Funds
    # -------------------------------------------------------------
    if failure_class == "insufficient_funds":
        if attempt_count == 1:
            if is_dnd and strict_dnd:
                return {
                    "action": "retry",
                    "rule_triggered": "RULE_INSUFFICIENT_FUNDS_RETRY_DND",
                    "reason": "Insufficient funds on 1st attempt. Customer on DND; scheduling silent retry.",
                    "is_override": False,
                }
            return {
                "action": "nudge",
                "rule_triggered": "RULE_INSUFFICIENT_FUNDS_NUDGE",
                "reason": "Insufficient funds on 1st attempt. Send friendly payment nudge & link.",
                "is_override": False,
            }
        return {
            "action": "retry",
            "rule_triggered": "RULE_INSUFFICIENT_FUNDS_RETRY",
            "reason": f"Insufficient funds on attempt {attempt_count}. Schedule silent retry.",
            "is_override": False,
        }

    # -------------------------------------------------------------
    # Rule 5: Network / Gateway Timeout Error
    # -------------------------------------------------------------
    if failure_class == "network_error":
        return {
            "action": "retry",
            "rule_triggered": "RULE_NETWORK_ERROR_RETRY",
            "reason": "Transient gateway network error. Schedule automatic retry.",
            "is_override": False,
        }

    # -------------------------------------------------------------
    # Rule 6: Bank Declined
    # -------------------------------------------------------------
    if failure_class == "bank_declined":
        if attempt_count >= 2:
            return {
                "action": "escalate",
                "rule_triggered": "RULE_BANK_DECLINED_MULTIPLE_ESCALATE",
                "reason": f"Repeated bank decline (attempt {attempt_count}). Escalate for support review.",
                "is_override": False,
            }
        if is_dnd and strict_dnd:
            return {
                "action": "retry",
                "rule_triggered": "RULE_BANK_DECLINED_RETRY_DND",
                "reason": "Bank declined 1st attempt. Customer on DND; scheduling silent retry.",
                "is_override": False,
            }
        return {
            "action": "nudge",
            "rule_triggered": "RULE_BANK_DECLINED_NUDGE",
            "reason": "Bank declined 1st attempt. Send nudge for customer to re-authorize with bank.",
            "is_override": False,
        }

    # -------------------------------------------------------------
    # Rule 7: Fallback Default
    # -------------------------------------------------------------
    if is_dnd and strict_dnd:
        return {
            "action": "retry",
            "rule_triggered": "RULE_DEFAULT_RETRY",
            "reason": "Unclassified failure. Customer on DND; scheduling silent retry.",
            "is_override": False,
        }

    return {
        "action": "nudge",
        "rule_triggered": "RULE_DEFAULT_NUDGE",
        "reason": "Unclassified failure. Send reminder link.",
        "is_override": False,
    }
