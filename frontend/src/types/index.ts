export interface Diagnosis {
  root_cause: string;
  confidence?: number;
  confidence_score?: number;
  suggested_action?: string;
  model_name?: string;
  reasoning_summary?: string;
  explanation?: string;
  is_fallback?: boolean;
  created_at?: string;
}

export interface PolicyDecision {
  attempt_number?: number;
  allowed?: boolean;
  action?: string;
  reason: string;
  rule_triggered?: string;
  is_override?: boolean;
  checked_at?: string;
  evaluated_at?: string;
}

export interface Intervention {
  action_type?: string;
  channel?: string;
  content?: string;
  message_text?: string | null;
  external_ref?: string | null;
  payment_link_id?: string | null;
  payment_link_url?: string | null;
  status?: string;
  executed_at?: string;
  sent_at?: string;
}

export interface Outcome {
  outcome?: string;
  status?: string;
  amount_recovered?: number;
  recovered_amount?: number;
  resolved_at?: string | null;
  recovered_at?: string | null;
  notes?: string | null;
}

export interface Case {
  case_id?: string;
  id?: string;
  order_id?: string;
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  amount: number;
  currency: string;
  payment_mode?: string;
  failure_class: string;
  is_dnd: boolean;
  attempt_count?: number;
  batch_id?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  diagnoses?: Diagnosis[];
  diagnosis?: Diagnosis | null;
  policy_decisions?: PolicyDecision[];
  policy_decision?: PolicyDecision | null;
  interventions: Intervention[];
  outcome?: Outcome | null;
}

export interface BatchSummary {
  batch_id?: string;
  total_cases: number;
  total_amount_at_risk?: number;
  total_revenue_at_risk?: number;
  total_amount_recovered?: number;
  total_revenue_recovered?: number;
  recovery_rate_pct?: number;
  recovery_rate_percent?: number;
  cases_recovered?: number;
  cases_blocked?: number;
  cases_escalated?: number;
  cases_pending?: number;
  by_failure_class?: Record<string, number>;
  failure_breakdown?: Record<string, number>;
  action_breakdown?: Record<string, number>;
  llm_calls_made?: number;
}

export interface PolicyConfig {
  max_attempts?: number;
  max_retries?: number;
  cooldown_hours?: Record<string, number> | number;
  high_value_threshold?: number;
  strict_dnd?: boolean;
  [key: string]: any;
}

export interface ListCasesParams {
  batchId?: string;
  failureClass?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface CaseDetailResponse {
  case: Case;
  diagnosis?: Diagnosis | null;
  policy_decision?: PolicyDecision | null;
  interventions: Intervention[];
  outcome?: Outcome | null;
}

export interface BatchItem {
  batch_id: string;
  created_at?: string;
  total_cases?: number;
}
