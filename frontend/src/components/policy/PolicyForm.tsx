import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import type { PolicyConfig } from '@/types';
import { updatePolicy } from '@/lib/api';
import { Save, CheckCircle2, AlertCircle, Info, Lock, ShieldCheck } from 'lucide-react';

interface PolicyFormProps {
  config: PolicyConfig;
  onSaveSuccess: () => void;
}

export function PolicyForm({ config, onSaveSuccess }: PolicyFormProps) {
  const [maxAttempts, setMaxAttempts] = useState<string>('3');
  const [highValueThreshold, setHighValueThreshold] = useState<string>('5000');

  // Cooldown hours for 5 failure classes
  const [cooldowns, setCooldowns] = useState<{
    insufficient_funds: string;
    bank_declined: string;
    network_error: string;
    card_expired: string;
    other: string;
  }>({
    insufficient_funds: '24',
    bank_declined: '12',
    network_error: '1',
    card_expired: '72',
    other: '24',
  });

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state when config prop updates
  useEffect(() => {
    if (config) {
      if (config.max_attempts !== undefined) {
        setMaxAttempts(String(config.max_attempts));
      }
      if (config.high_value_threshold !== undefined) {
        setHighValueThreshold(String(config.high_value_threshold));
      }

      // Handle nested or flat cooldown keys
      const newCooldowns = { ...cooldowns };
      if (typeof config.cooldown_hours === 'object' && config.cooldown_hours !== null) {
        if (config.cooldown_hours.insufficient_funds !== undefined)
          newCooldowns.insufficient_funds = String(config.cooldown_hours.insufficient_funds);
        if (config.cooldown_hours.bank_declined !== undefined)
          newCooldowns.bank_declined = String(config.cooldown_hours.bank_declined);
        if (config.cooldown_hours.network_error !== undefined)
          newCooldowns.network_error = String(config.cooldown_hours.network_error);
        if (config.cooldown_hours.card_expired !== undefined)
          newCooldowns.card_expired = String(config.cooldown_hours.card_expired);
        if (config.cooldown_hours.other !== undefined)
          newCooldowns.other = String(config.cooldown_hours.other);
      }

      // Also check flat keys from API
      if (config.cooldown_insufficient_funds !== undefined)
        newCooldowns.insufficient_funds = String(config.cooldown_insufficient_funds);
      if (config.cooldown_bank_declined !== undefined)
        newCooldowns.bank_declined = String(config.cooldown_bank_declined);
      if (config.cooldown_network_error !== undefined)
        newCooldowns.network_error = String(config.cooldown_network_error);
      if (config.cooldown_card_expired !== undefined)
        newCooldowns.card_expired = String(config.cooldown_card_expired);
      if (config.cooldown_other !== undefined)
        newCooldowns.other = String(config.cooldown_other);

      setCooldowns(newCooldowns);
    }
  }, [config]);

  const handleCooldownChange = (field: keyof typeof cooldowns, val: string) => {
    setCooldowns((prev) => ({ ...prev, [field]: val }));
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    const parsedMaxAttempts = Number(maxAttempts);
    if (maxAttempts.trim() === '' || isNaN(parsedMaxAttempts) || parsedMaxAttempts <= 0) {
      setErrorMessage('Max attempts must be a positive number (minimum 1).');
      return;
    }

    const parsedHighValue = Number(highValueThreshold);
    if (highValueThreshold.trim() === '' || isNaN(parsedHighValue) || parsedHighValue < 0) {
      setErrorMessage('High-value threshold must be a valid non-negative number.');
      return;
    }

    const cooldownKeys: (keyof typeof cooldowns)[] = [
      'insufficient_funds',
      'bank_declined',
      'network_error',
      'card_expired',
      'other',
    ];

    for (const key of cooldownKeys) {
      const val = cooldowns[key];
      const parsedVal = Number(val);
      if (val.trim() === '' || isNaN(parsedVal) || parsedVal < 0) {
        setErrorMessage(
          `Cooldown hours for '${key.replace('_', ' ')}' must be a non-negative number.`
        );
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        max_attempts: parsedMaxAttempts,
        high_value_threshold: parsedHighValue,
        cooldown_insufficient_funds: Number(cooldowns.insufficient_funds),
        cooldown_bank_declined: Number(cooldowns.bank_declined),
        cooldown_network_error: Number(cooldowns.network_error),
        cooldown_card_expired: Number(cooldowns.card_expired),
        cooldown_other: Number(cooldowns.other),
        cooldown_hours: {
          insufficient_funds: Number(cooldowns.insufficient_funds),
          bank_declined: Number(cooldowns.bank_declined),
          network_error: Number(cooldowns.network_error),
          card_expired: Number(cooldowns.card_expired),
          other: Number(cooldowns.other),
        },
      };

      await updatePolicy(payload);
      setSuccessMessage('Policy configuration saved successfully!');
      onSaveSuccess();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save policy configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/65 backdrop-blur-md rounded-3xl border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6 md:p-8 space-y-6 transition-all">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Policy Engine Rules
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure automated retry limits, cooldown periods, and security guardrails.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Active Ruleset</span>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3.5 text-sm text-rose-700 bg-rose-50/80 rounded-2xl border border-rose-200 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50/90 rounded-2xl border border-emerald-200 text-emerald-800 text-sm space-y-1 animate-in fade-in">
          <div className="flex items-center gap-2 font-semibold text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <p className="text-xs text-emerald-700 pl-6">
            Note: Changes will apply to the next batch run, not retroactively to in-progress retries.
          </p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Parameters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="max-attempts" className="text-sm font-semibold text-gray-700">
              Max Attempts per Case
            </Label>
            <Input
              id="max-attempts"
              type="number"
              min="1"
              step="1"
              value={maxAttempts}
              onChange={(e) => {
                setMaxAttempts(e.target.value);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              placeholder="e.g. 3"
              className="rounded-xl border-gray-200 bg-white/80 focus:bg-white text-gray-900 shadow-xs"
            />
            <p className="text-xs text-gray-500">
              Maximum retry attempts permitted before waiving or escalating a case.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="high-value-threshold" className="text-sm font-semibold text-gray-700">
              High-Value Threshold (₹)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
                ₹
              </span>
              <Input
                id="high-value-threshold"
                type="number"
                min="0"
                step="100"
                value={highValueThreshold}
                onChange={(e) => {
                  setHighValueThreshold(e.target.value);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                placeholder="e.g. 5000"
                className="pl-7 rounded-xl border-gray-200 bg-white/80 focus:bg-white text-gray-900 shadow-xs"
              />
            </div>
            <p className="text-xs text-gray-500">
              Cases with amounts equal to or exceeding this threshold are marked for priority review.
            </p>
          </div>
        </div>

        {/* Cooldown Hours by Failure Class Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
              Cooldown Hours (by Failure Class)
            </h3>
            <Tooltip content="Required wait time in hours between consecutive recovery retries for each error type.">
              <Info className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
            </Tooltip>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5 p-3 rounded-2xl bg-white/50 border border-gray-100">
              <Label htmlFor="cd-insufficient-funds" className="text-xs font-semibold text-gray-700 block truncate">
                Insufficient Funds
              </Label>
              <Input
                id="cd-insufficient-funds"
                type="number"
                min="0"
                step="1"
                value={cooldowns.insufficient_funds}
                onChange={(e) => handleCooldownChange('insufficient_funds', e.target.value)}
                className="rounded-xl border-gray-200 bg-white text-gray-900 shadow-xs h-9 text-sm"
              />
              <span className="text-[11px] text-gray-400 block">Hours</span>
            </div>

            <div className="space-y-1.5 p-3 rounded-2xl bg-white/50 border border-gray-100">
              <Label htmlFor="cd-bank-declined" className="text-xs font-semibold text-gray-700 block truncate">
                Bank Declined
              </Label>
              <Input
                id="cd-bank-declined"
                type="number"
                min="0"
                step="1"
                value={cooldowns.bank_declined}
                onChange={(e) => handleCooldownChange('bank_declined', e.target.value)}
                className="rounded-xl border-gray-200 bg-white text-gray-900 shadow-xs h-9 text-sm"
              />
              <span className="text-[11px] text-gray-400 block">Hours</span>
            </div>

            <div className="space-y-1.5 p-3 rounded-2xl bg-white/50 border border-gray-100">
              <Label htmlFor="cd-network-error" className="text-xs font-semibold text-gray-700 block truncate">
                Network Error
              </Label>
              <Input
                id="cd-network-error"
                type="number"
                min="0"
                step="1"
                value={cooldowns.network_error}
                onChange={(e) => handleCooldownChange('network_error', e.target.value)}
                className="rounded-xl border-gray-200 bg-white text-gray-900 shadow-xs h-9 text-sm"
              />
              <span className="text-[11px] text-gray-400 block">Hours</span>
            </div>

            <div className="space-y-1.5 p-3 rounded-2xl bg-white/50 border border-gray-100">
              <Label htmlFor="cd-card-expired" className="text-xs font-semibold text-gray-700 block truncate">
                Card Expired
              </Label>
              <Input
                id="cd-card-expired"
                type="number"
                min="0"
                step="1"
                value={cooldowns.card_expired}
                onChange={(e) => handleCooldownChange('card_expired', e.target.value)}
                className="rounded-xl border-gray-200 bg-white text-gray-900 shadow-xs h-9 text-sm"
              />
              <span className="text-[11px] text-gray-400 block">Hours</span>
            </div>

            <div className="space-y-1.5 p-3 rounded-2xl bg-white/50 border border-gray-100">
              <Label htmlFor="cd-other" className="text-xs font-semibold text-gray-700 block truncate">
                Other / Default
              </Label>
              <Input
                id="cd-other"
                type="number"
                min="0"
                step="1"
                value={cooldowns.other}
                onChange={(e) => handleCooldownChange('other', e.target.value)}
                className="rounded-xl border-gray-200 bg-white text-gray-900 shadow-xs h-9 text-sm"
              />
              <span className="text-[11px] text-gray-400 block">Hours</span>
            </div>
          </div>
        </div>

        {/* Locked Guardrail Toggle Section */}
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100/80 text-amber-800 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">
                  risk_hold never auto-retried
                </span>
                <Tooltip content="Hard safety rule: Risk hold cases involve suspected fraud or security flags and must be manually reviewed. Automated retries are strictly disabled by engine safety policy.">
                  <span className="inline-flex items-center">
                    <Info className="w-4 h-4 text-amber-600 cursor-pointer hover:text-amber-800 transition-colors" />
                  </span>
                </Tooltip>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Hard safety rule enforced by engine core. Non-configurable to prevent inadvertent compliance risks.
              </p>
            </div>
          </div>

          {/* Locked Switch / Toggle (Always ON & Disabled) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative inline-flex items-center h-6 w-11 shrink-0 cursor-not-allowed rounded-full bg-amber-500 opacity-90 transition-colors border border-amber-600/20">
              <span className="inline-block h-5 w-5 transform translate-x-5 rounded-full bg-white shadow-xs transition-transform flex items-center justify-center">
                <Lock className="w-2.5 h-2.5 text-amber-600" />
              </span>
            </div>
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              ALWAYS ON
            </span>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="pt-2 flex items-center justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-6 py-2.5 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Policy Config</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
