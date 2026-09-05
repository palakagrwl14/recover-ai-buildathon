import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Case, CaseDetailResponse, BatchItem } from '../types';
import { listCases, getCase, listBatches } from '../lib/api';
import AuditTable from '../components/cases/AuditTable';
import CaseDetail from '../components/cases/CaseDetail';

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

  return (
    <div className="w-full px-6 py-8 space-y-6">
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
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
          <label
            htmlFor="filter-batch"
            className="text-[11px] font-bold text-slate-400 uppercase tracking-wider"
          >
            Batch
          </label>
          <div className="relative">
            <select
              id="filter-batch"
              value={batchIdParam}
              onChange={(e) => updateFilter('batchId', e.target.value)}
              className="w-full appearance-none h-10 px-4 pr-10 bg-white/50 border border-slate-200/60 rounded-full text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20 cursor-pointer"
            >
              <option value="all">All Batches</option>
              {batches.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>
                  {b.batch_id} ({b.total_cases ?? 0} cases)
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Failure Class Filter */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label
            htmlFor="filter-failure-class"
            className="text-[11px] font-bold text-slate-400 uppercase tracking-wider"
          >
            Failure Class
          </label>
          <div className="relative">
            <select
              id="filter-failure-class"
              value={failureClassParam}
              onChange={(e) => updateFilter('failureClass', e.target.value)}
              className="w-full appearance-none h-10 px-4 pr-10 bg-white/50 border border-slate-200/60 rounded-full text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20 cursor-pointer"
            >
              {FAILURE_CLASS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label
            htmlFor="filter-status"
            className="text-[11px] font-bold text-slate-400 uppercase tracking-wider"
          >
            Status
          </label>
          <div className="relative">
            <select
              id="filter-status"
              value={statusParam}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full appearance-none h-10 px-4 pr-10 bg-white/50 border border-slate-200/60 rounded-full text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20 cursor-pointer"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
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
