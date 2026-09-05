import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { BatchSummary } from '../../types';

interface ClassBreakdownProps {
  summary: BatchSummary | null;
  loading?: boolean;
}

const FAILURE_CLASSES = [
  { key: 'insufficient_funds', label: 'Insufficient Funds' },
  { key: 'bank_declined', label: 'Bank Declined' },
  { key: 'network_error', label: 'Network Error' },
  { key: 'risk_hold', label: 'Risk Hold' },
  { key: 'card_expired', label: 'Card Expired' },
  { key: 'other', label: 'Other' },
];

export function ClassBreakdown({ summary, loading }: ClassBreakdownProps) {
  const breakdown = summary?.failure_breakdown ?? summary?.by_failure_class ?? {};

  const chartData = FAILURE_CLASSES.map(({ key, label }) => {
    const totalCases = breakdown[key] ?? 0;
    const totalAllCases = summary?.total_cases ?? 1;
    const recoveredAllCases =
      summary?.cases_recovered ??
      Math.round((summary?.total_cases ?? 0) * ((summary?.recovery_rate_percent ?? 50) / 100));
    const estimatedRecovered =
      totalCases > 0
        ? Math.round(totalCases * (recoveredAllCases / Math.max(1, totalAllCases)))
        : 0;

    return {
      category: label,
      totalCases,
      recoveredCases: Math.min(totalCases, estimatedRecovered),
    };
  });

  return (
    <div className="w-full bg-white/65 backdrop-blur-md rounded-3xl p-6 border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Failure Class Breakdown & Recovery Status
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Comparative analysis of detected payment failure categories vs recovered outcomes.
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-900/5 flex items-center justify-center text-slate-500 text-xs font-bold">
          ↗
        </div>
      </div>

      {loading ? (
        <div className="h-72 bg-slate-50 animate-pulse rounded-2xl flex items-center justify-center">
          <span className="text-slate-400 text-xs font-medium">Loading breakdown metrics...</span>
        </div>
      ) : (
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                formatter={(value: number, name: string) => [
                  value,
                  name === 'totalCases' ? 'Total Cases' : 'Recovered Cases',
                ]}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
                  padding: '12px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 500 }}
                formatter={(value: string) => (
                  <span className="text-slate-600 font-medium text-xs ml-1">
                    {value === 'totalCases' ? 'Total Cases' : 'Recovered Cases'}
                  </span>
                )}
              />
              <Bar
                dataKey="totalCases"
                name="totalCases"
                fill="#CBD5E1"
                radius={[8, 8, 0, 0]}
                barSize={24}
              />
              <Bar
                dataKey="recoveredCases"
                name="recoveredCases"
                fill="#10B981"
                radius={[8, 8, 0, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default ClassBreakdown;
