import type { BatchSummary } from '../../types';

interface StatRowProps {
  summary: BatchSummary | null;
  loading?: boolean;
}

export function StatRow({ summary, loading }: StatRowProps) {
  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const amountAtRisk = summary?.total_revenue_at_risk ?? summary?.total_amount_at_risk ?? 0;
  const amountRecovered = summary?.total_revenue_recovered ?? summary?.total_amount_recovered ?? 0;
  const recoveryRate = summary?.recovery_rate_percent ?? summary?.recovery_rate_pct ?? 0;
  const casesBlocked = summary?.cases_blocked ?? summary?.cases_pending ?? 0;
  const casesEscalated = summary?.cases_escalated ?? summary?.action_breakdown?.escalate ?? 0;

  const stats = [
    {
      title: 'TOTAL AMOUNT AT RISK',
      value: formatCurrency(amountAtRisk),
      subtitle: `${summary?.total_cases ?? 0} total cases processed`,
      color: 'text-amber-600',
      badgeBg: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'TOTAL AMOUNT RECOVERED',
      value: formatCurrency(amountRecovered),
      subtitle: 'Successfully recovered funds',
      color: 'text-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-700',
    },
    {
      title: 'RECOVERY RATE',
      value: `${recoveryRate.toFixed(1)}%`,
      subtitle: 'Overall recovery efficiency',
      color: 'text-slate-900',
      badgeBg: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'CASES BLOCKED',
      value: String(casesBlocked),
      subtitle: 'DND or waived cases',
      color: 'text-slate-900',
      badgeBg: 'bg-slate-100 text-slate-700',
    },
    {
      title: 'CASES ESCALATED',
      value: String(casesEscalated),
      subtitle: 'Require manual risk review',
      color: 'text-purple-600',
      badgeBg: 'bg-purple-50 text-purple-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="bg-white/65 backdrop-blur-md rounded-3xl p-6 border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between transition-all hover:shadow-[0_8px_25px_rgba(0,0,0,0.04)] hover:-translate-y-0.5"
        >
          {/* Top row: Label + Top-right arrow icon (from reference UI) */}
          <div className="flex items-start justify-between gap-2 mb-4">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              {stat.title}
            </span>
            <div className="w-7 h-7 rounded-full bg-slate-900/5 flex items-center justify-center text-slate-500 text-xs font-bold">
              ↗
            </div>
          </div>

          {/* Metric Value */}
          <div>
            {loading ? (
              <div className="h-9 w-28 bg-slate-100 animate-pulse rounded-lg mb-1" />
            ) : (
              <div className={`text-3xl font-extrabold tracking-tight ${stat.color}`}>
                {stat.value}
              </div>
            )}
            <p className="text-xs text-slate-400 font-medium mt-1">
              {stat.subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatRow;
