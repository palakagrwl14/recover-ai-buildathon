import { ExternalLink, ShieldCheck, ArrowRight, Lock, Layers, CheckCircle2 } from 'lucide-react';

export function About() {
  const steps = [
    { title: 'Detect', desc: 'Raw error events & webhook detection' },
    { title: 'Classify', desc: 'Normalized failure classification' },
    { title: 'Diagnose (LLM)', desc: 'Root cause analysis & message drafting' },
    { title: 'Policy Gate', desc: 'Deterministic rule validation (Zero LLM)' },
    { title: 'Intervene', desc: 'Safe retry or compliant customer nudge' },
    { title: 'Measure', desc: 'Recovery rate & audit trail outcome' },
  ];

  const guardrails = [
    {
      title: 'Max 3 Attempts per Case',
      desc: 'Strictly limits automated retries to prevent customer fatigue and unnecessary gateway charges.',
    },
    {
      title: 'Dynamic Cooldown Periods',
      desc: 'Enforces mandatory wait windows tailored by failure type (e.g. 24h for insufficient funds, 1h for gateway network timeouts).',
    },
    {
      title: 'Risk Hold Human Review',
      desc: 'Cases with suspected risk or fraud flags (risk_hold) bypass automated retry rules and mandate manual security team verification.',
    },
    {
      title: 'High-Value Escalation Capping',
      desc: 'High-value cases (₹5,000+) are capped at 1 automated retry attempt before mandatory team escalation.',
    },
  ];

  return (
    <div className="w-full px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-normal text-slate-900 tracking-tight">
            About <span className="font-asar font-bold text-slate-900 text-5xl inline-block ml-1">बरकत</span>
          </h1>
          <p className="text-base font-medium text-slate-600 mt-2 max-w-3xl leading-relaxed">
            <span className="font-asar font-bold text-slate-900 text-lg mr-1">बरकत</span> 
            is an autonomous agent that detects failed Razorpay payments, diagnoses the root cause using LLMs, and executes safe, policy-gated recovery actions with a complete immutable audit trail.
          </p>
        </div>

        <a
          href="https://github.com/palakagrwl14/recover-ai-buildathon"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all shrink-0 cursor-pointer self-start md:self-auto"
        >
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>View GitHub Repository</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>

      {/* 6-Stage Architecture Visual Flow */}
      <div className="bg-white/65 backdrop-blur-md rounded-3xl border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              6-Stage Autonomous Recovery Pipeline
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              End-to-end execution sequence from failure detection to outcome measurement.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative p-4 rounded-2xl bg-white/70 border border-gray-100 shadow-xs flex flex-col justify-between space-y-2 group hover:border-emerald-200 hover:bg-white transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                {idx < steps.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 hidden lg:block" />
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 tracking-tight">{step.title}</h3>
                <p className="text-[11px] font-medium text-gray-500 mt-1 leading-tight">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Design Principle (Highlighted Standout Callout Card) */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden space-y-3">
        <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Core Architectural Principle & Safety Guarantee</span>
        </div>

        <h3 className="text-lg md:text-xl font-bold text-white tracking-tight leading-snug">
          LLM Diagnoses & Drafts — Deterministic Code Enforces Policy
        </h3>

        <p className="text-sm text-slate-200 leading-relaxed font-normal">
          The LLM is strictly used for <strong>root cause diagnosis and reminder content generation</strong> — it <span className="underline decoration-emerald-400 decoration-2 underline-offset-2">NEVER directly invokes payment retries or messaging APIs</span>. Every proposed recovery action is validated by a separate, deterministic policy gate written in plain, rule-based code. This gate strictly enforces maximum retry limits, cooldown windows, DND opt-outs, and mandatory human escalation for risk/fraud cases.
        </p>
      </div>

      {/* Plain Language Guardrails */}
      <div className="bg-white/65 backdrop-blur-md rounded-3xl border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Safety Guardrails (In Plain Language)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Deterministic rules enforced to protect customer experience and financial compliance.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guardrails.map((g, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white/70 border border-gray-100/90 shadow-xs space-y-1.5 flex items-start gap-3"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-gray-900">{g.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{g.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default About;
