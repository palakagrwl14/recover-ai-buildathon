import type { Case } from '../../types';

interface AuditTableProps {
  cases: Case[];
  loading?: boolean;
  onSelectCase: (caseId: string) => void;
}

export function AuditTable({ cases, loading, onSelectCase }: AuditTableProps) {
  const formatCurrency = (val: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getGateResult = (c: Case) => {
    if (c.is_dnd) return { allowed: false, label: 'Blocked (DND)' };
    const pd = c.policy_decisions?.[0] || c.policy_decision;
    if (pd) {
      if (pd.allowed !== undefined) {
        return {
          allowed: pd.allowed,
          label: pd.allowed ? 'Allowed' : 'Blocked',
        };
      }
      if (pd.action?.toLowerCase() === 'waive') {
        return { allowed: false, label: 'Blocked (Waive)' };
      }
    }
    return { allowed: true, label: 'Allowed' };
  };

  const getActionTaken = (c: Case) => {
    const interv = c.interventions?.[0];
    if (interv?.channel || interv?.action_type) {
      return interv.channel || interv.action_type;
    }
    const pd = c.policy_decisions?.[0] || c.policy_decision;
    return pd?.action || 'pending';
  };

  const getOutcome = (c: Case) => {
    return c.outcome?.outcome || c.outcome?.status || c.status || 'pending';
  };

  const getOutcomeBadgeStyle = (outcomeStr: string) => {
    switch (outcomeStr.toLowerCase()) {
      case 'recovered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in_progress':
      case 'pending':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'review_required':
      case 'escalated':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'abandoned':
      case 'blocked':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-white rounded-3xl p-12 text-center border border-slate-200/70 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
          <svg className="animate-spin h-6 w-6 text-slate-900" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-xs font-semibold">Loading payment recovery cases...</span>
        </div>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="w-full bg-white rounded-3xl p-12 text-center border border-slate-200/70 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
        <p className="text-xs font-medium text-slate-400">
          No cases found matching selected filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white/65 backdrop-blur-md rounded-3xl border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200/40 bg-white/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3.5 px-6">Case ID</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Amount</th>
              <th className="py-3.5 px-4">Failure Class</th>
              <th className="py-3.5 px-4">Gate Result</th>
              <th className="py-3.5 px-4">Action Taken</th>
              <th className="py-3.5 px-6">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/60 font-medium text-slate-700">
            {cases.map((c) => {
              const caseId = c.case_id || c.id || '';
              const gate = getGateResult(c);
              const actionTaken = getActionTaken(c);
              const outcomeStr = getOutcome(c);

              return (
                <tr
                  key={caseId}
                  onClick={() => onSelectCase(caseId)}
                  className="hover:bg-white/50 transition-colors cursor-pointer"
                >
                  {/* Case ID */}
                  <td className="py-4 px-6 font-mono text-[11px] font-bold text-slate-900">
                    {caseId}
                  </td>

                  {/* Customer */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{c.customer_name}</span>
                      {c.is_dnd && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-rose-100 text-rose-700 border border-rose-200">
                          DND
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-4 px-4 font-bold text-slate-900">
                    {formatCurrency(c.amount, c.currency)}
                  </td>

                  {/* Failure Class */}
                  <td className="py-4 px-4">
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold capitalize bg-slate-100 text-slate-700 border border-slate-200/60">
                      {c.failure_class?.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Gate Result */}
                  <td className="py-4 px-4">
                    {gate.allowed ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Allowed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        {gate.label}
                      </span>
                    )}
                  </td>

                  {/* Action Taken */}
                  <td className="py-4 px-4 font-mono text-[11px] text-slate-500 capitalize">
                    {actionTaken?.replace('_', ' ')}
                  </td>

                  {/* Outcome */}
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold border ${getOutcomeBadgeStyle(
                        outcomeStr
                      )}`}
                    >
                      {outcomeStr.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AuditTable;
