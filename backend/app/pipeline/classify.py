"""
Error classification module.
Maps raw payment gateway (e.g. Razorpay) error codes & descriptions
to standard failure categories:
1. insufficient_funds
2. bank_declined
3. network_error
4. risk_hold
5. card_expired
6. other
"""

ERROR_CODE_MAP = {
    # Insufficient Funds
    "INSUFFICIENT_FUNDS": "insufficient_funds",
    "BAD_REQUEST_PAYMENT_ACCOUNT_INSUFFICIENT_BALANCE": "insufficient_funds",
    "PAYMENT_ACCOUNT_INSUFFICIENT_BALANCE": "insufficient_funds",
    
    # Bank Declined
    "BANK_DECLINED": "bank_declined",
    "BAD_REQUEST_PAYMENT_DECLINED_BY_BANK": "bank_declined",
    "PAYMENT_DECLINED_BY_BANK": "bank_declined",
    "CARD_DECLINED": "bank_declined",
    "PAYMENT_AUTHENTICATION_FAILED": "bank_declined",
    "BAD_REQUEST_PAYMENT_OTP_VALIDATION_FAILED": "bank_declined",
    
    # Network Error
    "NETWORK_ERROR": "network_error",
    "GATEWAY_ERROR": "network_error",
    "BAD_REQUEST_PAYMENT_TIMED_OUT": "network_error",
    "PAYMENT_TIMED_OUT": "network_error",
    "GATEWAY_TIMED_OUT": "network_error",
    "SERVER_ERROR": "network_error",
    
    # Risk Hold
    "RISK_HOLD": "risk_hold",
    "BAD_REQUEST_PAYMENT_BLOCKED_BY_RISK": "risk_hold",
    "PAYMENT_RISK_CHECK_FAILED": "risk_hold",
    "FRAUD_SUSPECTED": "risk_hold",
    
    # Card Expired
    "CARD_EXPIRED": "card_expired",
    "BAD_REQUEST_PAYMENT_CARD_EXPIRED": "card_expired",
    "EXPIRED_CARD": "card_expired",
}

FAILURE_CLASSES = {
    "insufficient_funds",
    "bank_declined",
    "network_error",
    "risk_hold",
    "card_expired",
    "other",
}


def classify_error(error_code: str, error_description: str = "") -> str:
    """
    Classify a payment error code and optional description into a standard failure class.
    Returns one of: insufficient_funds, bank_declined, network_error, risk_hold, card_expired, other
    """
    if not error_code:
        return "other"
        
    code_upper = error_code.strip().upper()
    
    # Direct lookup in mapping dictionary
    if code_upper in ERROR_CODE_MAP:
        return ERROR_CODE_MAP[code_upper]
        
    # Substring matching heuristics
    desc_upper = (error_description or "").strip().upper()
    combined = f"{code_upper} {desc_upper}"
    
    if any(kw in combined for kw in ["INSUFFICIENT", "BALANCE", "LOW_BALANCE"]):
        return "insufficient_funds"
    if any(kw in combined for kw in ["EXPIRED", "CARD_EXPIRED"]):
        return "card_expired"
    if any(kw in combined for kw in ["RISK", "FRAUD", "BLOCKED", "SUSPICIOUS"]):
        return "risk_hold"
    if any(kw in combined for kw in ["TIMEOUT", "TIMED_OUT", "GATEWAY", "NETWORK", "504", "502"]):
        return "network_error"
    if any(kw in combined for kw in ["DECLINED", "OTP", "AUTH", "REJECTED"]):
        return "bank_declined"
        
    return "other"
