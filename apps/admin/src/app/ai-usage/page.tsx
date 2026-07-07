"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type AIUsage = {
  id: string;
  action: string;
  tokensUsed: number;
  estimatedCost: number;
  model: string;
  createdAt: string;
  business: { id: string; name: string };
};

type Metrics = {
  totalTokens: number;
  totalCost: number;
  averageTokensPerRequest: number;
};

export default function AdminAiUsagePage() {
  const [logs, setLogs] = useState<AIUsage[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const data = await api.adminGetAiUsage();
      setLogs(data.logs);
      setMetrics(data.metrics);
    } catch (err) {
      console.error(err);
      alert("Failed to load AI usage details.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-slate-500 font-medium">Loading AI metrics log...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">AI Usage Monitor</h1>
        <p className="text-xs text-slate-500 mt-1">
          Trace Gemini API token dispatches, cost tracking, and draft generation rates platform-wide.
        </p>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Tokens Used</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{metrics.totalTokens.toLocaleString()}</div>
            <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Credits consumed in this period</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Accumulated API Cost</span>
            <div className="text-2xl font-black text-indigo-650 mt-1">${metrics.totalCost.toFixed(4)}</div>
            <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Calculated based on raw API weights</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Avg Tokens / Request</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{metrics.averageTokensPerRequest.toLocaleString()}</div>
            <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Payload efficiency average</span>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-950 mb-4">API Operations Stream</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-500 border-collapse">
            <thead>
              <tr className="border-b border-slate-100 uppercase text-[10px] font-bold text-slate-400">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Business</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Tokens Used</th>
                <th className="py-3 px-4">Model</th>
                <th className="py-3 px-4 text-right">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-mono text-[10px] text-slate-450">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">{log.business.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border bg-slate-50 text-slate-700 border-slate-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">
                    {log.tokensUsed}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-500">{log.model}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                    ${log.estimatedCost.toFixed(5)}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No active dispatches logged yet. Usage records will register automatically on new API triggers.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
