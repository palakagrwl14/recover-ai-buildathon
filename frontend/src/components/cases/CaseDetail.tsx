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
      {/* Solid Opaque Background (bg-white shadow-2xl), Quicksand Font */}
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-6 md:p-8 bg-white border-l border-slate-200 shadow-2xl z-50 text-slate-900 font-sans">
        <SheetHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-xl font-bold text-slate-900 font-sans tracking-tight">
              Audit Trail: {caseId}
            </SheetTitle>
            {isDnd && (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-rose-100 text-rose-700 border border-rose-200 shrink-0 font-sans">
                DND Protected
              </span>
            )}
          </div>
          <SheetDescription className="text-xs font-medium text-slate-500 font-sans mt-1">
            Complete step-by-step audit decision chain for {caseInfo?.customer_name || 'Customer'}.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3 font-sans">
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
          <div className="py-6 space-y-6 font-sans">
            {/* STEP 1: DETECTED */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold shrink-0">
                  1
                </span>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Step 1: Detected (Payment Failure)
                </h3>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 md:p-5 border border-slate-100 grid grid-cols-2 gap-4 text-xs">
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
                  <span className="font-semibold text-amber-700">
                    {caseInfo?.error_code || 'BAD_REQUEST_ERROR'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                    Failure Class
                  </span>
                  <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200/70 text-slate-800 capitalize">
                    {caseInfo?.failure_class?.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                    Amount
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatCurrency(caseInfo?.amount, caseInfo?.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* STEP 2: DIAGNOSED */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-bold shrink-0">
                  2
                </span>
                <h3 className="font-bold text-xs uppercase tracking-wider text-purple-700">
                  Step 2: LLM Diagnosis
                </h3>
              </div>
              <div className="bg-purple-50/70 rounded-2xl p-4 md:p-5 border border-purple-100 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-purple-500 block text-[10px] font-bold uppercase tracking-wider">
                      Root Cause
                    </span>
                    <span className="font-bold text-purple-950 text-sm">
                      {diagnosis?.root_cause || 'Transient gateway communication error'}
                    </span>
                  </div>
                  {(diagnosis?.confidence_score !== undefined ||
                    diagnosis?.confidence !== undefined) && (
                    <div className="text-right">
                      <span className="text-purple-500 block text-[10px] font-bold uppercase tracking-wider">
                        Confidence
                      </span>
                      <span className="font-bold text-purple-700">
                        {Math.round(
                          (diagnosis.confidence_score ?? diagnosis.confidence ?? 0.85) * 100
                        )}
                        %
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-purple-500 block text-[10px] font-bold uppercase tracking-wider mb-1">
                    LLM Suggested Action
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-purple-600 text-white inline-block">
                    {diagnosis?.suggested_action || policyDecision?.action || 'nudge'}
                  </span>
                </div>
                <div>
                  <span className="text-purple-500 block text-[10px] font-bold uppercase tracking-wider mb-1">
                    Reasoning Summary
                  </span>
                  <p className="text-slate-700 font-medium leading-relaxed bg-white p-3 rounded-xl border border-purple-100 shadow-2xs">
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
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-white text-xs font-bold shrink-0">
                  3
                </span>
                <h3 className="font-bold text-xs uppercase tracking-wider text-amber-800">
                  Step 3: Deterministic Policy Gate (Proof Point)
                </h3>
              </div>
              <div
                className={`p-4 md:p-5 rounded-2xl border transition-all ${
                  isAllowed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg shrink-0">{isAllowed ? '✓' : '🚫'}</span>
                    <span className="font-bold text-sm md:text-base tracking-tight">
                      Policy Decision: {isAllowed ? 'ALLOWED' : 'BLOCKED / OVERRIDDEN'}
                    </span>
                  </div>
                  <span
                    className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight break-all self-start sm:self-auto max-w-full ${
                      isAllowed ? 'bg-emerald-200/90 text-emerald-900' : 'bg-rose-200/90 text-rose-900'
                    }`}
                  >
                    {policyDecision?.rule_triggered ||
                      (isDnd ? 'RULE_DND_STRICT' : 'RULE_DEFAULT')}
                  </span>
                </div>

                <div className="mt-2.5 pt-2.5 border-t border-current/15 text-xs space-y-1">
                  <span className="font-bold uppercase tracking-wider text-[10px] opacity-80 block">
                    Gate Reason:
                  </span>
                  <p className="font-semibold leading-relaxed bg-white p-3 rounded-xl border border-current/15 text-slate-800 shadow-2xs">
                    {gateReason}
                  </p>
                </div>
              </div>
            </div>

            {/* STEP 4: ACTED */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                  4
                </span>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Step 4: Executed Intervention
                </h3>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 md:p-5 border border-slate-100 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                      Channel
                    </span>
                    <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200/70 text-slate-800 capitalize">
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
                    <p className="font-medium text-xs bg-white p-3 rounded-xl border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed">
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
                      className="text-blue-600 font-medium text-xs underline break-all hover:text-blue-800"
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
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold shrink-0">
                  5
                </span>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Step 5: Final Outcome & Recovery
                </h3>
              </div>
              <div className="bg-emerald-50/60 rounded-2xl p-4 md:p-5 border border-emerald-100 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                    Final Status
                  </span>
                  <span className="font-bold text-slate-900 text-sm capitalize">
                    {outcome?.outcome || outcome?.status || caseInfo?.status || 'pending'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                    Amount Recovered
                  </span>
                  <span className="font-extrabold text-emerald-700 text-sm">
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
