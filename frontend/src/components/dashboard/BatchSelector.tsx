import type { BatchItem } from '../../types';

interface BatchSelectorProps {
  batches: BatchItem[];
  selectedBatchId: string;
  onSelectBatch: (batchId: string) => void;
  onRunBatch: () => void;
  isRunning: boolean;
}

export function BatchSelector({
  batches,
  selectedBatchId,
  onSelectBatch,
  onRunBatch,
  isRunning,
}: BatchSelectorProps) {
  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="w-full bg-white/65 backdrop-blur-md rounded-3xl p-5 border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6 transition-all">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <label
            htmlFor="batch-select"
            className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap"
          >
            Select Batch
          </label>
          <div className="relative flex-1 max-w-md">
            <select
              id="batch-select"
              value={selectedBatchId}
              onChange={(e) => onSelectBatch(e.target.value)}
              disabled={isRunning || batches.length === 0}
              className="w-full appearance-none h-10 px-4 pr-10 bg-white/50 border border-slate-200/60 rounded-full text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {batches.length === 0 ? (
                <option value="">No batches found</option>
              ) : (
                batches.map((batch) => (
                  <option key={batch.batch_id} value={batch.batch_id}>
                    {batch.batch_id} {batch.created_at ? `(${formatDate(batch.created_at)})` : ''}{' '}
                    {batch.total_cases !== undefined ? `• ${batch.total_cases} cases` : ''}
                  </option>
                ))
              )}
            </select>
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onRunBatch}
          disabled={isRunning}
          className="h-10 px-6 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-full shadow-sm hover:shadow transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
        >
          {isRunning ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Executing Batch...</span>
            </>
          ) : (
            <>
              <span>⚡ Run new batch (150 cases)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default BatchSelector;
