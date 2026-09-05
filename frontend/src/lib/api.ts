import type {
  Case,
  CaseDetailResponse,
  BatchSummary,
  PolicyConfig,
  ListCasesParams,
  BatchItem,
} from '../types';

const BASE_URL = 'http://localhost:8000';

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API Error [${response.status} ${response.statusText}] for ${endpoint}: ${errorText || 'Unknown error'}`
    );
  }

  return response.json();
}

/**
 * Triggers a synthetic batch payment recovery run.
 */
export async function runBatch(n: number = 150, seed?: number): Promise<any> {
  const body: Record<string, any> = { count: n };
  if (seed !== undefined) {
    body.seed = seed;
  }

  return fetchJson<any>('/api/batch/run', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Fetches batch summary metrics.
 */
export async function getBatchSummary(batchId?: string): Promise<BatchSummary> {
  const query = batchId ? `?batch_id=${encodeURIComponent(batchId)}` : '';
  return fetchJson<BatchSummary>(`/api/batch/summary${query}`);
}

/**
 * Lists all execution batches.
 */
export async function listBatches(): Promise<BatchItem[]> {
  try {
    return await fetchJson<BatchItem[]>('/api/batches');
  } catch {
    // Fallback if backend uses /api/batch/list
    return await fetchJson<BatchItem[]>('/api/batch/list');
  }
}

/**
 * Lists payment recovery cases with optional filtering.
 */
export async function listCases(params: ListCasesParams = {}): Promise<Case[]> {
  const queryParams = new URLSearchParams();
  
  if (params.batchId) queryParams.append('batch_id', params.batchId);
  if (params.failureClass) queryParams.append('failure_class', params.failureClass);
  if (params.status) queryParams.append('status', params.status);
  if (params.limit !== undefined) queryParams.append('limit', String(params.limit));
  if (params.offset !== undefined) queryParams.append('offset', String(params.offset));

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchJson<Case[]>(`/api/cases${queryString}`);
}

/**
 * Fetches detailed audit trail for a single case.
 */
export async function getCase(caseId: string): Promise<CaseDetailResponse | Case> {
  return fetchJson<CaseDetailResponse | Case>(`/api/cases/${encodeURIComponent(caseId)}`);
}

/**
 * Fetches active policy configuration.
 */
export async function getPolicy(): Promise<PolicyConfig> {
  return fetchJson<PolicyConfig>('/api/policy/config');
}

/**
 * Updates active policy configuration settings.
 */
export async function updatePolicy(config: Partial<PolicyConfig>): Promise<any> {
  return fetchJson<any>('/api/policy/config', {
    method: 'PUT',
    body: JSON.stringify(config),
  });
}

/**
 * Fetches policy change audit history logs.
 */
export async function getPolicyHistory(): Promise<any> {
  try {
    return await fetchJson<any>('/api/policy/history');
  } catch {
    return await fetchJson<any>('/api/policy/logs');
  }
}
