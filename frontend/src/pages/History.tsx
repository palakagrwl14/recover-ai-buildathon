import { useEffect, useState } from 'react';
import type { BatchItem } from '@/types';
import { listBatches } from '@/lib/api';
import { BatchHistoryTable } from '@/components/history/BatchHistoryTable';
import { RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export function History() {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNotification, setRefreshNotification] = useState<boolean>(false);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listBatches();
      const list = Array.isArray(data) ? data : [];

      // Sort safely by most recent first
      const sorted = [...list].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        const valA = isNaN(timeA) ? 0 : timeA;
        const valB = isNaN(timeB) ? 0 : timeB;
        return valB - valA;
      });

      setBatches(sorted);
    } catch (err: any) {
      console.error('Failed to fetch batch execution history:', err);
      setError(
        err?.message || 'Unable to load batch execution history. Please check backend connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRefresh = async () => {
    setRefreshNotification(false);
    await fetchHistory();
    setRefreshNotification(true);
    setTimeout(() => {
      setRefreshNotification(false);
    }, 3000);
  };

  return (
    <div className="w-full px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-normal text-slate-900 tracking-tight">
            Execution Batch History
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Track historical batch runs, compare recovery rates across policy iterations, and inspect run logs.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {refreshNotification && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>History Refreshed!</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white/70 hover:bg-white border border-slate-200 rounded-xl shadow-xs backdrop-blur-md transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Connection / Load Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50/90 border border-rose-200 text-rose-800 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchHistory}
            className="px-4 py-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 text-xs font-semibold transition-all shadow-xs cursor-pointer shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Main Content Table */}
      <BatchHistoryTable batches={batches} loading={loading} />
    </div>
  );
}

export default History;
