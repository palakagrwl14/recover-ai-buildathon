"""
LLM & Rule-based Diagnosis Module.
Analyzes payment failure cases and outputs structured JSON diagnosis.
Provides automatic rule-based fallback when LLM API keys are unavailable.
"""

import json
import os
from typing import Dict, Any

FALLBACK_DIAGNOSES: Dict[str, Dict[str, Any]] = {
    "insufficient_funds": {
        "root_cause": "Account balance below transaction threshold",
        "confidence_score": 0.90,
        "explanation": "Customer account lacked sufficient funds at payment processing time. Typically a temporary liquidity mismatch near salary/billing cycles.",
    },
    "bank_declined": {
        "root_cause": "Issuing bank security or authorization decline",
        "confidence_score": 0.85,
        "explanation": "The card issuing bank declined authorization. Common reasons include daily transaction limits, 3D-Secure failure, or security block.",
    },
    "network_error": {
        "root_cause": "Transient gateway or network communication timeout",
        "confidence_score": 0.95,
        "explanation": "Payment processing timed out between payment gateway and bank network. High recovery probability upon automatic retry.",
    },
    "risk_hold": {
        "root_cause": "Anti-fraud & risk management trigger",
        "confidence_score": 0.88,
        "explanation": "Transaction flagged by risk engine due to anomaly detection (ip mismatch, high velocity, or blacklist). Manual security review recommended.",
    },
    "card_expired": {
        "root_cause": "Payment card past expiry date",
        "confidence_score": 0.98,
        "explanation": "The card on file has expired. Requires customer outreach to register an updated payment method.",
    },
    "other": {
        "root_cause": "Unclassified payment gateway exception",
        "confidence_score": 0.70,
        "explanation": "General payment processing failure. Requires observation or manual customer follow-up.",
    },
}


def _get_rule_fallback_diagnosis(case_data: dict) -> dict:
    """Generates deterministic rule-based diagnosis when LLM is unavailable."""
    failure_class = (case_data.get("failure_class") or "other").lower()
    base_info = FALLBACK_DIAGNOSES.get(failure_class, FALLBACK_DIAGNOSES["other"])
    
    amount = case_data.get("amount", 0.0)
    attempt_count = case_data.get("attempt_count", 1)
    
    explanation = f"{base_info['explanation']} (Case Amount: INR {amount:,.2f}, Attempt #{attempt_count})."
    
    return {
        "root_cause": base_info["root_cause"],
        "confidence_score": base_info["confidence_score"],
        "explanation": explanation,
        "is_fallback": True,
        "raw_llm_response": "N/A (Rule-based Fallback)",
        "model_name": "rule-engine-v1",
    }


def diagnose_case(case_data: dict) -> dict:
    """
    Diagnoses a payment failure case.
    Uses Anthropic Claude if ANTHROPIC_API_KEY is available,
    otherwise smoothly falls back to rule-based diagnosis.
    """
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    
    if not anthropic_key:
        return _get_rule_fallback_diagnosis(case_data)
        
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=anthropic_key)
        model_used = "claude-3-5-sonnet-20241022"
        
        prompt = f"""
You are a payment failure diagnosis AI. Analyze the following failed payment case and return a strict JSON object.

Case Details:
- Customer Name: {case_data.get('customer_name', 'N/A')}
- Amount: INR {case_data.get('amount', 0.0)}
- Failure Category: {case_data.get('failure_class', 'other')}
- Error Code: {case_data.get('error_code', 'N/A')}
- Error Description: {case_data.get('error_description', 'N/A')}
- Attempt Count: {case_data.get('attempt_count', 1)}
- Payment Mode: {case_data.get('payment_mode', 'N/A')}

Return JSON with exact keys:
- "root_cause": concise 1-sentence root cause
- "confidence_score": float between 0.0 and 1.0
- "explanation": 2-3 sentence explanation of the failure reason and recovery outlook
"""
        response = client.messages.create(
            model=model_used,
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        
        content_text = response.content[0].text
        data = json.loads(content_text)
        
        return {
            "root_cause": data.get("root_cause", "Payment processing error"),
            "confidence_score": float(data.get("confidence_score", 0.85)),
            "explanation": data.get("explanation", "Analyzed via Claude AI."),
            "is_fallback": False,
            "raw_llm_response": content_text,
            "model_name": model_used,
        }
    except Exception as e:
        # On any API error, timeout, or parsing error, fallback gracefully
        fallback = _get_rule_fallback_diagnosis(case_data)
        fallback["explanation"] += f" (LLM call failed: {str(e)})"
        return fallback
