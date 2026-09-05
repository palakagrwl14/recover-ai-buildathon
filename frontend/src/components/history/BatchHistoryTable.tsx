import { useNavigate } from 'react-router-dom';
import type { BatchItem } from '@/types';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { TrendingUp, Layers, Calendar, ArrowUpRight, ShieldCheck, PlayCircle } from 'lucide-react';

interface BatchHistoryTableProps {
  batches: BatchItem[];
  loading?: boolean;
}

export function BatchHistoryTable({ batches, loading }: BatchHistoryTableProps) {
  const navigate = useNavigate();

  const handleRowClick = (batchId: string) => {
    if (!batchId) return;
    navigate(`/?batch=${encodeURIComponent(batchId)}`);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return String(dateStr);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateStr);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/65 backdrop-blur-md rounded-3xl border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-12 text-center space-y-3">
        <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-gray-500">Loading batch execution history...</p>
      </div>
    );
  }

  if (!batches || !Array.isArray(batches) || batches.length === 0) {
    return (
      <div className="bg-white/65 backdrop-blur-md rounded-3xl border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <PlayCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-gray-900">No Batches Processed Yet</h3>
          <p className="text-sm font-medium text-gray-500 max-w-sm mx-auto">
            Run your first batch from the Dashboard to start tracking recovery performance across policy iterations.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <span>Run your first batch from the Dashboard</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/65 backdrop-blur-md rounded-3xl border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6 md:p-8 space-y-4 transition-all">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Batch Execution Runs
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Click any batch row to inspect its live analytics dashboard & detailed case chain.
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {batches.length} {batches.length === 1 ? 'Run' : 'Total Runs'}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200/80 bg-white/80 overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50/80 border-b border-gray-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-bold text-gray-700 text-xs uppercase tracking-wider py-3.5 pl-4">
                Batch ID
              </TableHead>
              <TableHead className="font-bold text-gray-700 text-xs uppercase tracking-wider py-3.5">
                Run Timestamp
              </TableHead>
              {/* Prominent Case Count Header */}
              <TableHead className="font-extrabold text-slate-900 text-xs uppercase tracking-wider py-3.5 text-center">
                Case Count
              </TableHead>
              <TableHead className="font-bold text-gray-700 text-xs uppercase tracking-wider py-3.5 text-right">
                Amount Recovered
              </TableHead>
              {/* Prominent Recovery Rate Header */}
              <TableHead className="font-extrabold text-emerald-800 text-xs uppercase tracking-wider py-3.5 text-center">
                Recovery Rate %
              </TableHead>
              <TableHead className="font-bold text-gray-700 text-xs uppercase tracking-wider py-3.5 pr-4 text-right">
                Policy Version Active
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100">
            {batches.map((batch, idx) => {
              const rawRecRate = batch.recovery_rate_pct ?? batch.recovery_rate_percent ?? 0;
              const recRate = typeof rawRecRate === 'number' ? rawRecRate : (parseFloat(String(rawRecRate)) || 0);

              const rawAmt = batch.amount_recovered ?? 0;
              const amtRecovered = typeof rawAmt === 'number' ? rawAmt : (parseFloat(String(rawAmt)) || 0);

              const caseCount = Number(batch.total_cases ?? 0);
              const policyVer = String(batch.policy_version || 'v1.0 Standard');
              const batchId = String(batch.batch_id || `batch_${idx}`);

              return (
                <TableRow
                  key={batchId}
                  onClick={() => handleRowClick(batchId)}
                  className="hover:bg-emerald-50/40 transition-all cursor-pointer group"
                >
                  {/* Batch ID */}
                  <TableCell className="py-4 pl-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {batchId}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-600 transition-colors" />
                    </div>
                  </TableCell>

                  {/* Run Timestamp */}
                  <TableCell className="py-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{formatDate(batch.created_at)}</span>
                    </div>
                  </TableCell>

                  {/* Case Count (Visually Prominent) */}
                  <TableCell className="py-4 text-center">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-xl bg-slate-900 text-white font-extrabold text-xs shadow-xs tracking-wide">
                      <Layers className="w-3 h-3 mr-1 text-slate-300" />
                      {caseCount} Cases
                    </span>
                  </TableCell>

                  {/* Amount Recovered */}
                  <TableCell className="py-4 text-right">
                    <span className="font-mono font-bold text-gray-900 text-sm">
                      ₹{amtRecovered.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </TableCell>

                  {/* Recovery Rate % (Most Visually Prominent!) */}
                  <TableCell className="py-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-emerald-500/10 text-emerald-800 border border-emerald-300/60 shadow-xs">
                      <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-extrabold text-sm tracking-tight text-emerald-900">
                        {recRate.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>

                  {/* Policy Version Active */}
                  <TableCell className="py-4 pr-4 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                      {policyVer}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
