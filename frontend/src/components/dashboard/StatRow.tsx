import type { BatchSummary } from '../../types';
import {
  ShoppingBag,
  Package,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

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
  const totalCases = summary?.total_cases ?? 0;

  const stats = [
    {
      title: 'Amount at Risk',
      value: formatCurrency(amountAtRisk),
      subtitle: 'Total processed',
      icon: ShoppingBag,
      valueColor: 'text-amber-600',
      badgeText: `${totalCases} cases`,
      badgeIcon: ArrowUpRight,
      badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    },
    {
      title: 'Amount Recovered',
      value: formatCurrency(amountRecovered),
      subtitle: 'Successful recovery',
      icon: Package,
      valueColor: 'text-emerald-600',
      badgeText: `+${recoveryRate > 0 ? recoveryRate.toFixed(0) : 0}%`,
      badgeIcon: TrendingUp,
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    },
    {
      title: 'Recovery Rate',
      value: `${recoveryRate.toFixed(1)}%`,
      subtitle: 'Overall efficiency',
      icon: BarChart3,
      valueColor: 'text-slate-900',
      badgeText: recoveryRate >= 50 ? '+18%' : '+5%',
      badgeIcon: TrendingUp,
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    },
    {
      title: 'Cases Blocked',
      value: String(casesBlocked),
      subtitle: 'DND & Waived',
      icon: ShieldCheck,
      valueColor: 'text-slate-900',
      badgeText: 'Protected',
      badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200/60',
    },
    {
      title: 'Cases Escalated',
      value: String(casesEscalated),
      subtitle: 'Manual review',
      icon: AlertTriangle,
      valueColor: 'text-slate-900',
      badgeText: 'High Risk',
      badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200/60',
    },
  ];

  return (
    <div className="bg-white/65 backdrop-blur-md rounded-3xl border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/60">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const BadgeIcon = stat.badgeIcon;
          return (
            <div
              key={stat.title}
              className="p-6 md:p-7 flex flex-col justify-between hover:bg-white/40 transition-colors"
            >
              {/* Top Header Row */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-base font-semibold text-slate-800 tracking-tight">
                  {stat.title}
                </span>
                <div className="w-10 h-10 rounded-full border border-slate-200/80 bg-white/80 flex items-center justify-center text-slate-500 shadow-xs shrink-0">
                  <Icon className="w-4 h-4 text-slate-600" />
                </div>
              </div>

              {/* Center Big Value */}
              <div className="mb-4">
                {loading ? (
                  <div className="h-8 w-28 bg-slate-200/60 animate-pulse rounded-lg" />
                ) : (
                  <div className={`text-2xl lg:text-3xl font-extrabold tracking-tight ${stat.valueColor}`}>
                    {stat.value}
                  </div>
                )}
              </div>

              {/* Bottom Subtitle + Trend Badge */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-400 font-medium whitespace-nowrap">
                  {stat.subtitle}
                </span>
                {stat.badgeText && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${stat.badgeClass}`}
                  >
                    {stat.badgeText}
                    {BadgeIcon && <BadgeIcon className="w-3 h-3 stroke-[2.5]" />}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StatRow;

