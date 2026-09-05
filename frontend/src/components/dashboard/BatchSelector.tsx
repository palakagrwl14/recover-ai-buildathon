import type { BatchItem } from '../../types';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  const getSelectedBatchLabel = (id: string) => {
    const found = batches.find((b) => b.batch_id === id);
    if (!found) return id || 'Select batch...';
    const dateStr = found.created_at ? `(${formatDate(found.created_at)})` : '';
    const casesStr = found.total_cases !== undefined ? `• ${found.total_cases} cases` : '';
    return `${found.batch_id} ${dateStr} ${casesStr}`.trim();
  };

  return (
    <div className="w-full bg-white/65 backdrop-blur-md rounded-3xl p-5 border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6 transition-all">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            Select Batch
          </label>
          <div className="flex-1 max-w-md">
            <Select
              value={selectedBatchId}
              onValueChange={(val) => onSelectBatch(val)}
              disabled={isRunning || batches.length === 0}
            >
              <SelectTrigger className="w-full h-10 px-4 bg-white/50 hover:bg-white border border-slate-200/60 rounded-full text-xs font-semibold text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900/20">
                <SelectValue placeholder="Select batch...">
                  {getSelectedBatchLabel(selectedBatchId)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl max-h-60 overflow-y-auto">
                {batches.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No batches found
                  </SelectItem>
                ) : (
                  batches.map((batch) => (
                    <SelectItem
                      key={batch.batch_id}
                      value={batch.batch_id}
                      className="text-xs font-medium py-2 px-3 focus:bg-slate-100 cursor-pointer"
                    >
                      {batch.batch_id} {batch.created_at ? `(${formatDate(batch.created_at)})` : ''}{' '}
                      {batch.total_cases !== undefined ? `• ${batch.total_cases} cases` : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Button 01 - With Icon (Shadcnspace component) */}
        <button
          type="button"
          onClick={onRunBatch}
          disabled={isRunning}
          className="h-10 pl-5 pr-1.5 bg-slate-900 hover:bg-black text-white text-xs font-medium rounded-full shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-between gap-3 whitespace-nowrap cursor-pointer shrink-0"
        >
          <span>{isRunning ? 'Executing Batch...' : 'Run New Batch'}</span>
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-slate-900 shadow-xs shrink-0">
            {isRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-900" />
            ) : (
              <ArrowUpRight className="w-4 h-4 text-slate-900 stroke-[2.5]" />
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

export default BatchSelector;

