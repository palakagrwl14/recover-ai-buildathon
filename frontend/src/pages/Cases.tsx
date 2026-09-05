import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Case, CaseDetailResponse, BatchItem } from '../types';
import { listCases, getCase, listBatches } from '../lib/api';
import AuditTable from '../components/cases/AuditTable';
import CaseDetail from '../components/cases/CaseDetail';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FAILURE_CLASS_OPTIONS = [
  { value: 'all', label: 'All Failure Classes' },
  { value: 'insufficient_funds', label: 'Insufficient Funds' },
  { value: 'bank_declined', label: 'Bank Declined' },
  { value: 'network_error', label: 'Network Error' },
  { value: 'risk_hold', label: 'Risk Hold' },
  { value: 'card_expired', label: 'Card Expired' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'recovered', label: 'Recovered' },
  { value: 'abandoned', label: 'Abandoned' },
  { value: 'review_required', label: 'Review Required' },
];

export function Cases() {
  const [searchParams, setSearchParams] = useSearchParams();

  const batchIdParam = searchParams.get('batchId') || 'all';
  const failureClassParam = searchParams.get('failureClass') || 'all';
  const statusParam = searchParams.get('status') || 'all';

  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loadingCases, setLoadingCases] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<CaseDetailResponse | Case | null>(
    null
  );
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  useEffect(() => {
    listBatches()
      .then((data) => {
        setBatches(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to load batch filter options:', err);
      });
  }, []);

  const fetchCasesList = useCallback(async () => {
    setLoadingCases(true);
    setError(null);
    try {
      const data = await listCases({
        batchId: batchIdParam !== 'all' ? batchIdParam : undefined,
        failureClass: failureClassParam !== 'all' ? failureClassParam : undefined,
        status: statusParam !== 'all' ? statusParam : undefined,
      });
      setCases(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch cases:', err);
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoadingCases(false);
    }
  }, [batchIdParam, failureClassParam, statusParam]);

  useEffect(() => {
    fetchCasesList();
  }, [fetchCasesList]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all' || !value) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const handleSelectCase = async (caseId: string) => {
    setSelectedCaseId(caseId);
    setSelectedCaseDetail(null);
    setLoadingDetail(true);

    try {
      const detail = await getCase(caseId);
      setSelectedCaseDetail(detail);
    } catch (err) {
      console.error(`Failed to fetch detail for case ${caseId}:`, err);
      const rowObj = cases.find((c) => (c.case_id || c.id) === caseId);
      if (rowObj) {
        setSelectedCaseDetail(rowObj);
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  const getBatchLabel = (id: string) => {
    if (id === 'all' || !id) return 'All Batches';
    const found = batches.find((b) => b.batch_id === id);
    return found ? `${found.batch_id} (${found.total_cases ?? 0} cases)` : id;
  };

  const getFailureClassLabel = (val: string) => {
    const found = FAILURE_CLASS_OPTIONS.find((o) => o.value === val);
    return found ? found.label : 'All Failure Classes';
  };

  const getStatusLabel = (val: string) => {
    const found = STATUS_OPTIONS.find((o) => o.value === val);
    return found ? found.label : 'All Statuses';
  };

  return (
    <div className="w-full px-6 py-8 space-y-6">
      <div>
        <h1 className="text-4xl font-normal text-slate-900 tracking-tight">
          Payment Recovery Cases
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1.5">
          Inspect end-to-end classification, LLM diagnosis, policy gates, and recovery outcomes.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold">
          <div>
            <strong>Backend Error:</strong> {error}
          </div>
          <button
            type="button"
            onClick={() => fetchCasesList()}
            className="px-4 py-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Control Container */}
      <div className="bg-white/65 backdrop-blur-md rounded-3xl p-5 border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-wrap items-center gap-4">
        {/* Batch Filter */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Batch
          </label>
          <Select
            value={batchIdParam}
            onValueChange={(val) => updateFilter('batchId', val)}
          >
            <SelectTrigger className="w-full h-10 px-4 bg-white/50 hover:bg-white border border-slate-200/60 rounded-full text-xs font-semibold text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900/20">
              <SelectValue placeholder="All Batches">
                {getBatchLabel(batchIdParam)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl max-h-60 overflow-y-auto">
              <SelectItem value="all" className="text-xs font-medium py-2 px-3 focus:bg-slate-100 cursor-pointer">
                All Batches
              </SelectItem>
              {batches.map((b) => (
                <SelectItem
                  key={b.batch_id}
                  value={b.batch_id}
                  className="text-xs font-medium py-2 px-3 focus:bg-slate-100 cursor-pointer"
                >
                  {b.batch_id} ({b.total_cases ?? 0} cases)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Failure Class Filter */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Failure Class
          </label>
          <Select
            value={failureClassParam}
            onValueChange={(val) => updateFilter('failureClass', val)}
          >
            <SelectTrigger className="w-full h-10 px-4 bg-white/50 hover:bg-white border border-slate-200/60 rounded-full text-xs font-semibold text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900/20">
              <SelectValue placeholder="All Failure Classes">
                {getFailureClassLabel(failureClassParam)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl max-h-60 overflow-y-auto">
              {FAILURE_CLASS_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-xs font-medium py-2 px-3 focus:bg-slate-100 cursor-pointer"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Status
          </label>
          <Select
            value={statusParam}
            onValueChange={(val) => updateFilter('status', val)}
          >
            <SelectTrigger className="w-full h-10 px-4 bg-white/50 hover:bg-white border border-slate-200/60 rounded-full text-xs font-semibold text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900/20">
              <SelectValue placeholder="All Statuses">
                {getStatusLabel(statusParam)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl max-h-60 overflow-y-auto">
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-xs font-medium py-2 px-3 focus:bg-slate-100 cursor-pointer"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Audit Cases Table */}
      <AuditTable cases={cases} loading={loadingCases} onSelectCase={handleSelectCase} />

      {/* Slide-out Audit Trail Drawer */}
      <CaseDetail
        caseId={selectedCaseId}
        caseDetail={selectedCaseDetail}
        loading={loadingDetail}
        isOpen={Boolean(selectedCaseId)}
        onClose={() => {
          setSelectedCaseId(null);
          setSelectedCaseDetail(null);
        }}
      />
    </div>
  );
}

export default Cases;
