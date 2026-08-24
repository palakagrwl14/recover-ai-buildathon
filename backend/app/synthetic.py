"""
Synthetic Failed-Payment Dataset Generator.
Generates realistic payment failure records with distribution weights and deliberate edge cases
(DND users, high-value transactions, max attempt count, risk holds).
"""

import random
import uuid
from typing import List, Dict, Any

INDIAN_NAMES = [
    "Rahul Sharma", "Priya Patel", "Amit Verma", "Neha Gupta", "Vikram Singh",
    "Ananya Reddy", "Siddharth Kumar", "Pooja Mehta", "Rohan Joshi", "Divya Agarwal",
    "Karan Malhotra", "Sneha Nair", "Aditya Deshmukh", "Kavya Iyer", "Sanjay Rao",
    "Meera Mukherjee", "Arjun Bhatia", "Shreya Saxena", "Tarun Choudhury", "Nisha Das"
]

DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com", "company.in"]

PAYMENT_MODES = ["upi", "card", "netbanking"]

FAILURE_SPECS = [
    {
        "failure_class": "insufficient_funds",
        "weight": 0.35,
        "error_code": "BAD_REQUEST_PAYMENT_ACCOUNT_INSUFFICIENT_BALANCE",
        "error_description": "Account balance insufficient to complete payment",
    },
    {
        "failure_class": "bank_declined",
        "weight": 0.25,
        "error_code": "PAYMENT_DECLINED_BY_BANK",
        "error_description": "Declined by issuing bank security policy",
    },
    {
        "failure_class": "network_error",
        "weight": 0.15,
        "error_code": "GATEWAY_TIMED_OUT",
        "error_description": "Connection to bank gateway timed out after 30s",
    },
    {
        "failure_class": "card_expired",
        "weight": 0.10,
        "error_code": "EXPIRED_CARD",
        "error_description": "Credit/debit card past expiration date",
    },
    {
        "failure_class": "risk_hold",
        "weight": 0.10,
        "error_code": "BAD_REQUEST_PAYMENT_BLOCKED_BY_RISK",
        "error_description": "Transaction flagged by risk engine anomaly detection",
    },
    {
        "failure_class": "other",
        "weight": 0.05,
        "error_code": "UNKNOWN_GATEWAY_ERROR",
        "error_description": "Unclassified payment processing exception",
    },
]


def generate_synthetic_cases(count: int = 150) -> List[Dict[str, Any]]:
    """
    Generates a list of realistic synthetic failed payment cases.
    """
    random.seed(42)  # Deterministic seed for reproducible batch generation
    cases = []
    
    weights = [spec["weight"] for spec in FAILURE_SPECS]

    for i in range(1, count + 1):
        spec = random.choices(FAILURE_SPECS, weights=weights, k=1)[0]
        
        name = random.choice(INDIAN_NAMES)
        first_name = name.split()[0].lower()
        email = f"{first_name}.{random.randint(10, 99)}@{random.choice(DOMAINS)}"
        phone = f"+91{random.randint(7000000000, 9999999999)}"
        
        # High value case (12% chance)
        is_high_value = random.random() < 0.12
        if is_high_value:
            amount = float(random.choice([12000, 15500, 25000, 38000, 50000]))
        else:
            amount = float(random.choice([299, 499, 999, 1499, 2499, 4999, 7999]))

        # Attempt count distribution (70% 1st attempt, 20% 2nd attempt, 10% 3rd attempt)
        attempt_roll = random.random()
        if attempt_roll < 0.70:
            attempt_count = 1
        elif attempt_roll < 0.90:
            attempt_count = 2
        else:
            attempt_count = 3  # Max attempt edge case

        # DND status (15% chance)
        is_dnd = random.random() < 0.15

        case_id = f"case_{i:03d}_{uuid.uuid4().hex[:6]}"
        cust_id = f"cust_{random.randint(1000, 9999)}"

        case_item = {
            "id": case_id,
            "customer_id": cust_id,
            "customer_name": name,
            "customer_email": email,
            "customer_phone": phone,
            "is_dnd": is_dnd,
            "amount": amount,
            "currency": "INR",
            "payment_mode": random.choice(PAYMENT_MODES),
            "error_code": spec["error_code"],
            "error_description": spec["error_description"],
            "failure_class": spec["failure_class"],
            "attempt_count": attempt_count,
            "status": "pending",
        }
        cases.append(case_item)

    return cases
