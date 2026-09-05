import type { Case, CaseDetailResponse } from '../../types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../ui/sheet';

interface CaseDetailProps {
  caseId: string | null;
  caseDetail: CaseDetailResponse | Case | null;
  loading?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function CaseDetail({
  caseId,
  caseDetail,
  loading,
  isOpen,
  onClose,
}: CaseDetailProps) {
  if (!isOpen) return null;

  const detailObj = caseDetail as CaseDetailResponse;
  const flatCase = caseDetail as Case;

  const caseInfo = detailObj?.case || flatCase;
  const diagnosis = detailObj?.diagnosis || flatCase?.diagnosis || flatCase?.diagnoses?.[0];
  const policyDecision =
    detailObj?.policy_decision || flatCase?.policy_decision || flatCase?.policy_decisions?.[0];
  const intervention = detailObj?.interventions?.[0] || flatCase?.interventions?.[0];
  const outcome = detailObj?.outcome || flatCase?.outcome;

  const isDnd = Boolean(caseInfo?.is_dnd);
  const isAllowed =
    policyDecision?.allowed ?? (!isDnd && policyDecision?.action?.toLowerCase() !== 'waive');
  const gateReason =
    policyDecision?.reason ||
    (isDnd
      ? 'Customer registered on Do-Not-Disturb (DND) list'
      : 'Standard policy rule evaluation');

  const formatCurrency = (amount?: number, currency: string = 'INR') => {
    if (amount === undefined || amount === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-6 bg-slate-50/50">
        <SheetHeader className="pb-4 border-b border-slate-200/80">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-xl font-extrabold font-mono text-slate-900">
              Audit Trail: {caseId}
            </SheetTitle>
            {isDnd && (
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-rose-100 text-rose-700 border border-rose-200">
                DND Protected
              </span>
            )}
          </div>
          <SheetDescription className="text-xs font-medium text-slate-500">
            Complete step-by-step audit decision chain for {caseInfo?.customer_name || 'Customer'}.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
            <svg className="animate-spin h-6 w-6 text-slate-900" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-xs font-semibold">Fetching audit trail details...</span>
          </div>
        ) : (
          <div className="py-6 space-y-6">
            {/* STEP 1: DETECTED */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold">
                  1
                </span>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Step 1: Detected (Payment Failure)
                </h3>
              </div>
              <div className="bg-white rounded-3xl p-5 border border-slate-200/70 shadow-xs grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                    Source Gateway
                  </span>
                  <span className="font-semibold text-slate-900">Razorpay Gateway</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                    Raw Error Code
                  </span>
                  <span className="font-mono font-semibold text-amber-600">
                    {caseInfo?.error_code || 'BAD_REQUEST_ERROR'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                    Failure Class
                  </span>
                  <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 capitalize">
                    {caseInfo?.failure_class?.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                    Amount
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {formatCurrency(caseInfo?.amount, caseInfo?.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* STEP 2: DIAGNOSED */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-bold">
                  2
                </span>
                <h3 className="font-bold text-xs uppercase tracking-wider text-purple-600">
                  Step 2: LLM Diagnosis
                </h3>
              </div>
              <div className="bg-purple-50/50 rounded-3xl p-5 border border-purple-200/60 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-purple-400 block text-[10px] font-bold uppercase tracking-wider">
                      Root Cause
                    </span>
                    <span className="font-bold text-purple-950 text-sm">
                      {diagnosis?.root_cause || 'Transient gateway communication error'}
                    </span>
                  </div>
                  {(diagnosis?.confidence_score !== undefined ||
                    diagnosis?.confidence !== undefined) && (
                    <div className="text-right">
                      <span className="text-purple-400 block text-[10px] font-bold uppercase tracking-wider">
                        Confidence
                      </span>
                      <span className="font-extrabold text-purple-700">
                        {Math.round(
                          (diagnosis.confidence_score ?? diagnosis.confidence ?? 0.85) * 100
                        )}
                        %
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-purple-400 block text-[10px] font-bold uppercase tracking-wider mb-1">
                    LLM Suggested Action
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-purple-600 text-white inline-block">
                    {diagnosis?.suggested_action || policyDecision?.action || 'nudge'}
                  </span>
                </div>
                <div>
                  <span className="text-purple-400 block text-[10px] font-bold uppercase tracking-wider mb-1">
                    Reasoning Summary
                  </span>
                  <p className="text-slate-600 font-medium leading-relaxed bg-white/90 p-3 rounded-2xl border border-purple-100">
                    {diagnosis?.explanation ||
                      diagnosis?.reasoning_summary ||
                      'The failure was categorized based on merchant API status logs and customer payment profile.'}
                  </p>
                </div>
              </div>
            </div>

            {/* STEP 3: GATED (PROMINENT POLICY GATE BANNER) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-white text-xs font-bold">
                  3
                </span>
                <h3 className="font-bold text-xs uppercase tracking-wider text-amber-700">
                  Step 3: Deterministic Policy Gate (Proof Point)
                </h3>
              </div>
              <div
                className={`p-5 rounded-3xl border-2 shadow-xs transition-all ${
                  isAllowed
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50/80 border-rose-300 text-rose-950'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{isAllowed ? '✓' : '🚫'}</span>
                    <span className="font-extrabold text-base tracking-tight">
                      Policy Decision: {isAllowed ? 'ALLOWED' : 'BLOCKED / OVERRIDDEN'}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                      isAllowed ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    {policyDecision?.rule_triggered ||
                      (isDnd ? 'RULE_DND_STRICT' : 'RULE_DEFAULT')}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-current/20 text-xs space-y-1">
                  <span className="font-bold uppercase tracking-wider text-[10px] opacity-80 block">
                    Gate Reason:
                  </span>
                  <p className="font-semibold leading-relaxed bg-white/90 p-3.5 rounded-2xl border border-current/20 text-slate-800">
                    {gateReason}
                  </p>
                </div>
              </div>
            </div>

            {/* STEP 4: ACTED */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                  4
                </span>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Step 4: Executed Intervention
                </h3>
              </div>
              <div className="bg-white rounded-3xl p-5 border border-slate-200/70 shadow-xs space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                      Channel
                    </span>
                    <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 capitalize font-mono">
                      {intervention?.channel ||
                        intervention?.action_type ||
                        policyDecision?.action ||
                        'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                      Status
                    </span>
                    <span className="font-semibold text-slate-900 capitalize">
                      {intervention?.status || 'Executed'}
                    </span>
                  </div>
                </div>
                {(intervention?.message_text || intervention?.content) && (
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">
                      Drafted Message Content
                    </span>
                    <p className="font-mono text-[11px] bg-slate-50 p-3 rounded-2xl border border-slate-200 text-slate-800 whitespace-pre-wrap">
                      {intervention.message_text || intervention.content}
                    </p>
                  </div>
                )}
                {(intervention?.payment_link_url || intervention?.external_ref) && (
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">
                      Razorpay Payment Link
                    </span>
                    <a
                      href={intervention.payment_link_url || intervention.external_ref || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 font-mono text-[11px] underline break-all hover:text-blue-800"
                    >
                      {intervention.payment_link_url || intervention.external_ref}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 5: RESOLVED */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                  5
                </span>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Step 5: Final Outcome & Recovery
                </h3>
              </div>
              <div className="bg-emerald-50/40 rounded-3xl p-5 border border-emerald-200/60 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                    Final Status
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm capitalize">
                    {outcome?.outcome || outcome?.status || caseInfo?.status || 'pending'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                    Amount Recovered
                  </span>
                  <span className="font-extrabold text-emerald-600 text-sm">
                    {formatCurrency(
                      outcome?.recovered_amount ?? outcome?.amount_recovered,
                      caseInfo?.currency
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default CaseDetail;
