"""
Intervention & Outreach Executor Module.
Creates Razorpay payment links (real or mock fallback) and drafts personalized outreach messages.
"""

import os
import uuid
from typing import Dict, Any


def _create_razorpay_payment_link(case_data: dict) -> dict:
    """
    Creates a Razorpay Payment Link using live SDK if credentials exist,
    otherwise returns a structured mock payment link.
    """
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")

    amount_in_paisa = int(round(float(case_data.get("amount", 0.0)) * 100))
    case_id = str(case_data.get("id") or f"case_{uuid.uuid4().hex[:8]}")

    if key_id and key_secret:
        try:
            import razorpay
            client = razorpay.Client(auth=(key_id, key_secret))
            payload = {
                "amount": amount_in_paisa,
                "currency": "INR",
                "accept_partial": False,
                "reference_id": case_id,
                "description": f"Payment recovery for case {case_id}",
                "customer": {
                    "name": case_data.get("customer_name", "Valued Customer"),
                    "email": case_data.get("customer_email", "customer@example.com"),
                    "contact": case_data.get("customer_phone", "+919999999999"),
                },
                "notify": {"sms": True, "email": True},
                "reminder_enable": True,
            }
            res = client.payment_link.create(payload)
            return {
                "payment_link_id": res.get("id"),
                "payment_link_url": res.get("short_url"),
                "is_mock": False,
            }
        except Exception as e:
            # Fallback to mock on API error
            pass

    # Mock payment link generator
    mock_id = f"plink_mock_{uuid.uuid4().hex[:10]}"
    mock_url = f"https://pay.razorpay.com/{mock_id}"
    return {
        "payment_link_id": mock_id,
        "payment_link_url": mock_url,
        "is_mock": True,
    }


def execute_intervention(case_data: dict, policy_decision: dict) -> dict:
    """
    Executes outreach/intervention based on policy action decision.
    
    Returns dict:
    - channel: razorpay_link | whatsapp | sms | email | manual | none
    - payment_link_id: str or None
    - payment_link_url: str or None
    - message_text: str
    - status: sent | mocked | scheduled | escalated | waived
    """
    action = (policy_decision.get("action") or "retry").lower()
    customer_name = case_data.get("customer_name") or "Customer"
    amount = float(case_data.get("amount") or 0.0)
    failure_class = (case_data.get("failure_class") or "other").lower()

    if action == "nudge":
        link_info = _create_razorpay_payment_link(case_data)
        url = link_info["payment_link_url"]

        if failure_class == "card_expired":
            msg = f"Hi {customer_name}, your card payment of INR {amount:,.2f} failed due to card expiration. Update your details & complete payment here: {url}"
        elif failure_class == "bank_declined":
            msg = f"Hi {customer_name}, your bank declined your payment of INR {amount:,.2f}. Try completing it securely here: {url}"
        elif failure_class == "insufficient_funds":
            msg = f"Hi {customer_name}, your payment of INR {amount:,.2f} was unsuccessful. Click here to complete your payment: {url}"
        else:
            msg = f"Hi {customer_name}, your payment of INR {amount:,.2f} is pending. Secure payment link: {url}"

        channel = "email" if case_data.get("is_dnd") else "whatsapp"
        status = "mocked" if link_info["is_mock"] else "sent"

        return {
            "channel": channel,
            "payment_link_id": link_info["payment_link_id"],
            "payment_link_url": url,
            "message_text": msg,
            "status": status,
        }

    elif action == "retry":
        link_info = _create_razorpay_payment_link(case_data)
        return {
            "channel": "razorpay_link",
            "payment_link_id": link_info["payment_link_id"],
            "payment_link_url": link_info["payment_link_url"],
            "message_text": f"Automated silent payment retry scheduled for INR {amount:,.2f}.",
            "status": "scheduled",
        }

    elif action == "escalate":
        return {
            "channel": "manual",
            "payment_link_id": None,
            "payment_link_url": None,
            "message_text": f"CASE ESCALATED to support desk. Reason: {policy_decision.get('reason')}",
            "status": "escalated",
        }

    elif action == "waive":
        return {
            "channel": "none",
            "payment_link_id": None,
            "payment_link_url": None,
            "message_text": f"Recovery waived. Reason: {policy_decision.get('reason')}",
            "status": "waived",
        }

    return {
        "channel": "none",
        "payment_link_id": None,
        "payment_link_url": None,
        "message_text": "No intervention required.",
        "status": "completed",
    }
