import { useState, useEffect, useCallback } from 'react';
import type { BatchItem, BatchSummary } from '../types';
import { listBatches, getBatchSummary, runBatch } from '../lib/api';
import BatchSelector from '../components/dashboard/BatchSelector';
import StatRow from '../components/dashboard/StatRow';
import ClassBreakdown from '../components/dashboard/ClassBreakdown';

export function Dashboard() {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [summary, setSummary] = useState<BatchSummary | null>(null);

  const [loadingBatches, setLoadingBatches] = useState<boolean>(true);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [isRunningBatch, setIsRunningBatch] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBatches = useCallback(
    async (selectBatchId?: string) => {
      setLoadingBatches(true);
      setError(null);
      try {
        const data = await listBatches();
        const batchList = Array.isArray(data) ? data : [];
        setBatches(batchList);

        if (selectBatchId) {
          setSelectedBatchId(selectBatchId);
        } else if (batchList.length > 0 && !selectedBatchId) {
          setSelectedBatchId(batchList[0].batch_id);
        }
      } catch (err: any) {
        console.error('Failed to fetch batches:', err);
        setError(
          err.message || 'Unable to connect to RecoverAI backend at http://localhost:8000'
        );
      } finally {
        setLoadingBatches(false);
      }
    },
    [selectedBatchId]
  );

  const fetchSummary = useCallback(async (batchId: string) => {
    if (!batchId) return;
    setLoadingSummary(true);
    setError(null);
    try {
      const res = await getBatchSummary(batchId);
      setSummary(res);
    } catch (err: any) {
      console.error(`Failed to fetch summary for batch ${batchId}:`, err);
      setError(err.message || `Failed to fetch summary for batch ${batchId}`);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      fetchSummary(selectedBatchId);
    }
  }, [selectedBatchId, fetchSummary]);

  const handleRunBatch = async () => {
    setIsRunningBatch(true);
    setError(null);
    try {
      const randomSeed = Math.floor(Math.random() * 10000);
      const res = await runBatch(150, randomSeed);
      console.log('Run batch response:', res);

      const newBatchId = res?.batch_id;
      if (newBatchId) {
        await fetchBatches(newBatchId);
        await fetchSummary(newBatchId);
      } else {
        await fetchBatches();
      }
    } catch (err: any) {
      console.error('Run batch error:', err);
      setError(
        err.message || 'Failed to trigger new batch run. Please verify backend server is running.'
      );
    } finally {
      setIsRunningBatch(false);
    }
  };

  return (
    <div className="w-full px-6 py-8">
      {/* Dashboard Heading (Match Reference Crextio Header) */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Payment Recovery Dashboard
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1.5">
          Real-time analytics and autonomous payment failure recovery metrics.
        </p>
      </div>

      {/* Connection Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold">
          <div>
            <strong>Backend Connection Error:</strong> {error}
          </div>
          <button
            type="button"
            onClick={() => fetchBatches()}
            className="px-4 py-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Execution Batch Selection Control */}
      <BatchSelector
        batches={batches}
        selectedBatchId={selectedBatchId}
        onSelectBatch={(id) => setSelectedBatchId(id)}
        onRunBatch={handleRunBatch}
        isRunning={isRunningBatch || loadingBatches}
      />

      {/* KPI Stats Row */}
      <StatRow summary={summary} loading={loadingSummary} />

      {/* Failure Class Breakdown Chart */}
      <ClassBreakdown summary={summary} loading={loadingSummary} />
    </div>
  );
}

export default Dashboard;
