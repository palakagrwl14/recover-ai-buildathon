import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { History, ArrowRight, Clock, UserCheck } from 'lucide-react';

export interface PolicyHistoryLog {
  id?: number | string;
  config_key: string;
  old_value: string | null;
  new_value: string;
  changed_by?: string;
  changed_at?: string;
}

interface PolicyChangeLogProps {
  logs: PolicyHistoryLog[];
  loading?: boolean;
}

const KEY_LABELS: Record<string, string> = {
  max_attempts: 'Max Attempts per Case',
  high_value_threshold: 'High-Value Threshold (₹)',
  cooldown_insufficient_funds: 'Cooldown: Insufficient Funds (hrs)',
  cooldown_bank_declined: 'Cooldown: Bank Declined (hrs)',
  cooldown_network_error: 'Cooldown: Network Error (hrs)',
  cooldown_card_expired: 'Cooldown: Card Expired (hrs)',
  cooldown_other: 'Cooldown: Other / Default (hrs)',
  strict_dnd: 'Strict DND Protection',
  risk_hold_auto_retry: 'Risk Hold Auto Retry',
  cooldown_hours: 'Cooldown Hours Matrix',
};

export function PolicyChangeLog({ logs, loading }: PolicyChangeLogProps) {
  // Filter out raw JSON dict objects or duplicate nested entries
  const displayLogs = (logs || []).filter((log) => {
    if (!log.config_key || log.config_key === 'cooldown_hours') return false;
    if (log.new_value && (log.new_value.startsWith('{') || log.new_value.startsWith("'"))) return false;
    return true;
  });

  const formatKeyName = (key: string) => {
    return KEY_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white/65 backdrop-blur-md rounded-3xl border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6 md:p-8 space-y-4 transition-all">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-slate-100 text-slate-700">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Policy Audit & Change History
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Read-only immutable history log of all policy rule changes and overrides.
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {displayLogs.length} {displayLogs.length === 1 ? 'Entry' : 'Entries'}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-gray-400">Loading policy history logs...</p>
        </div>
      ) : displayLogs.length === 0 ? (
        <div className="py-12 text-center space-y-2 bg-white/40 rounded-2xl border border-dashed border-gray-200">
          <Clock className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="text-sm font-semibold text-gray-600">No policy changes recorded yet</p>
          <p className="text-xs text-gray-400">
            Any future updates made to policy configuration will be audited here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200/80 bg-white/80 overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-gray-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-gray-700 text-xs uppercase tracking-wider py-3">
                  Setting / Parameter Changed
                </TableHead>
                <TableHead className="font-bold text-gray-700 text-xs uppercase tracking-wider py-3">
                  Value Transition (Old → New)
                </TableHead>
                <TableHead className="font-bold text-gray-700 text-xs uppercase tracking-wider py-3">
                  Changed By
                </TableHead>
                <TableHead className="font-bold text-gray-700 text-xs uppercase tracking-wider py-3 text-right">
                  Timestamp
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100">
              {displayLogs.map((log, idx) => (
                <TableRow key={log.id || idx} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="py-3.5">
                    <div className="font-semibold text-gray-900 text-sm">
                      {formatKeyName(log.config_key)}
                    </div>
                    <div className="text-[11px] font-mono text-gray-400">
                      key: {log.config_key}
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 font-medium">
                        {log.old_value !== null && log.old_value !== undefined
                          ? String(log.old_value)
                          : 'Default'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                        {String(log.new_value)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{log.changed_by || 'admin_api'}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5 text-right font-mono text-xs text-gray-500">
                    {formatDate(log.changed_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
