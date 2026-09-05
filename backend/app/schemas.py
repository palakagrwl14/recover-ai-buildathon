from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class BatchRunRequest(BaseModel):
    count: int = Field(default=150, ge=1, le=500, description="Number of synthetic cases to generate and process")
    config_overrides: Optional[Dict[str, Any]] = Field(default=None, description="Optional temporary policy configuration overrides")


class PolicyConfigUpdate(BaseModel):
    max_retries: Optional[int] = Field(default=None, ge=1, le=10)
    high_value_threshold: Optional[float] = Field(default=None, ge=100.0)
    strict_dnd: Optional[bool] = Field(default=None)


class CaseSummary(BaseModel):
    id: str
    customer_name: str
    customer_email: str
    amount: float
    currency: str
    payment_mode: str
    failure_class: str
    attempt_count: int
    status: str
    is_dnd: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DiagnosisDetail(BaseModel):
    root_cause: str
    confidence_score: float
    explanation: str
    is_fallback: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PolicyDecisionDetail(BaseModel):
    action: str
    reason: str
    rule_triggered: str
    is_override: bool
    allowed: Optional[bool] = None
    evaluated_at: datetime

    class Config:
        from_attributes = True


class InterventionDetail(BaseModel):
    channel: str
    payment_link_id: Optional[str]
    payment_link_url: Optional[str]
    message_text: Optional[str]
    status: str
    sent_at: datetime

    class Config:
        from_attributes = True


class OutcomeDetail(BaseModel):
    status: str
    recovered_amount: float
    recovered_at: Optional[datetime]
    notes: Optional[str]

    class Config:
        from_attributes = True


class CaseDetailResponse(BaseModel):
    case: CaseSummary
    diagnosis: Optional[DiagnosisDetail]
    policy_decision: Optional[PolicyDecisionDetail]
    interventions: List[InterventionDetail] = []
    outcome: Optional[OutcomeDetail]


class BatchSummaryResponse(BaseModel):
    total_cases: int
    total_revenue_at_risk: float
    total_revenue_recovered: float
    recovery_rate_percent: float
    cases_blocked: Optional[int] = 0
    cases_escalated: Optional[int] = 0
    cases_recovered: Optional[int] = 0
    cases_pending: Optional[int] = 0
    action_breakdown: Dict[str, int]
    failure_breakdown: Dict[str, int]
