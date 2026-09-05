from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Case(Base):
    __tablename__ = "cases"

    id = Column(String, primary_key=True, index=True)
    customer_id = Column(String, index=True)
    customer_name = Column(String)
    customer_email = Column(String)
    customer_phone = Column(String)
    is_dnd = Column(Boolean, default=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    payment_mode = Column(String, nullable=False)  # card, upi, netbanking
    error_code = Column(String, nullable=False)
    error_description = Column(Text, nullable=True)
    failure_class = Column(String, index=True)  # insufficient_funds, bank_declined, network_error, risk_hold, card_expired, other
    attempt_count = Column(Integer, default=1)
    batch_id = Column(String, index=True, nullable=True)
    status = Column(String, default="pending", index=True)  # pending, in_progress, recovered, abandoned, review_required
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    diagnosis = relationship("DiagnosisRecord", back_populates="case", uselist=False, cascade="all, delete-orphan")
    policy_decision = relationship("PolicyDecision", back_populates="case", uselist=False, cascade="all, delete-orphan")
    interventions = relationship("InterventionRecord", back_populates="case", cascade="all, delete-orphan")
    outcome = relationship("Outcome", back_populates="case", uselist=False, cascade="all, delete-orphan")


class DiagnosisRecord(Base):
    __tablename__ = "diagnosis_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, unique=True)
    root_cause = Column(String, nullable=False)
    confidence_score = Column(Float, nullable=False)
    explanation = Column(Text, nullable=False)
    is_fallback = Column(Boolean, default=False)
    raw_llm_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="diagnosis")


class PolicyDecision(Base):
    __tablename__ = "policy_decisions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, unique=True)
    action = Column(String, nullable=False)  # retry, nudge, escalate, waive
    reason = Column(Text, nullable=False)
    rule_triggered = Column(String, nullable=False)
    is_override = Column(Boolean, default=False)
    evaluated_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="policy_decision")


class InterventionRecord(Base):
    __tablename__ = "intervention_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    channel = Column(String, nullable=False)  # razorpay_link, whatsapp, sms, email, manual
    payment_link_id = Column(String, nullable=True)
    payment_link_url = Column(String, nullable=True)
    message_text = Column(Text, nullable=True)
    sent_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="sent")  # sent, delivered, failed

    case = relationship("Case", back_populates="interventions")


class Outcome(Base):
    __tablename__ = "outcomes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, unique=True)
    status = Column(String, nullable=False)  # recovered, abandoned, pending
    recovered_amount = Column(Float, default=0.0)
    recovered_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    case = relationship("Case", back_populates="outcome")


class PolicyConfig(Base):
    __tablename__ = "policy_configs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PolicyChangeLog(Base):
    __tablename__ = "policy_change_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    config_key = Column(String, nullable=False)
    old_value = Column(String, nullable=True)
    new_value = Column(String, nullable=False)
    changed_by = Column(String, default="admin")
    changed_at = Column(DateTime, default=datetime.utcnow)
