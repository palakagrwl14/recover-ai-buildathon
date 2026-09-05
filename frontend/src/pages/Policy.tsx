import { useEffect, useState } from 'react';
import { getPolicy, getPolicyHistory } from '@/lib/api';
import type { PolicyConfig } from '@/types';
import { PolicyForm } from '@/components/policy/PolicyForm';
import { PolicyChangeLog } from '@/components/policy/PolicyChangeLog';
import type { PolicyHistoryLog } from '@/components/policy/PolicyChangeLog';
import { RefreshCw } from 'lucide-react';

export function Policy() {
  const [config, setConfig] = useState<PolicyConfig>({});
  const [historyLogs, setHistoryLogs] = useState<PolicyHistoryLog[]>([]);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);

  const fetchPolicyData = async () => {
    try {
      setLoadingConfig(true);
      const data = await getPolicy();
      setConfig(data || {});
    } catch (err) {
      console.error('Failed to fetch policy config:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchHistoryData = async () => {
    try {
      setLoadingHistory(true);
      const logs = await getPolicyHistory();
      setHistoryLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      console.error('Failed to fetch policy history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchPolicyData();
    fetchHistoryData();
  }, []);

  const handleSaveSuccess = () => {
    fetchPolicyData();
    fetchHistoryData();
  };

  return (
    <div className="w-full px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-normal text-slate-900 tracking-tight">
            Policy Configuration
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Configure autonomous recovery rules, cooldown matrices, and guardrail parameters.
          </p>
        </div>

        <button
          onClick={() => {
            fetchPolicyData();
            fetchHistoryData();
          }}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 bg-white/70 hover:bg-white border border-gray-200 rounded-xl shadow-xs backdrop-blur-md transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingConfig || loadingHistory ? 'animate-spin' : ''}`} />
          <span>Refresh Settings</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="space-y-8">
        <PolicyForm config={config} onSaveSuccess={handleSaveSuccess} />
        <PolicyChangeLog logs={historyLogs} loading={loadingHistory} />
      </div>
    </div>
  );
}

export default Policy;
