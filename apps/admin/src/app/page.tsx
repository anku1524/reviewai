"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";

type KPIs = {
  totalUsers: number;
  totalBusinesses: number;
  totalLocations: number;
  totalReviews: number;
  totalRequests: number;
  totalAiDrafts: number;
  averageRating: number;
};

type AIUsage = {
  businessId: string;
  businessName: string;
  requestsCount: number;
  draftsCount: number;
};

export default function AdminOverviewPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [aiUsage, setAiUsage] = useState<AIUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const stats = await api.adminGetStats();
      setKpis(stats.kpis);
      setAiUsage(stats.aiUsage);
    } catch (err) {
      console.error("Failed to load admin telemetry stats:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-slate-500 font-medium">Loading administrative dashboard statistics...</div>;
  }

  if (!kpis) {
    return <div className="p-8 text-slate-500 font-medium">No administrative stats loaded.</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">SaaS Overview & Telemetry</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor aggregated SaaS performance indicators, system capacity, and AI resource consumption.
        </p>
      </div>

      {/* KPI Stats Scorecard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Registered Users</span>
          <h3 className="text-2xl font-black text-slate-900">{kpis.totalUsers} Accounts</h3>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Across all multi-tenant databases</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Active Locations</span>
          <h3 className="text-2xl font-black text-slate-900">{kpis.totalLocations} Mapped</h3>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">{kpis.totalBusinesses} Business registries</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Synced Platform Reviews</span>
          <h3 className="text-2xl font-black text-slate-900">{kpis.totalReviews}</h3>
          <p className="text-[10px] text-emerald-600 mt-1 font-medium font-mono">{kpis.averageRating.toFixed(2)} ★ Global Average</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">AI response drafts</span>
          <h3 className="text-2xl font-black text-indigo-600">{kpis.totalAiDrafts}</h3>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">{kpis.totalRequests} Campaign dispatches</p>
        </div>

      </div>

      {/* AI Telemetry cost trackers */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-900">AI Usage & Cost Monitor</h2>
          <p className="text-[10px] text-slate-400 font-medium">
            Monitor review outreach campaigns and Gemini response drafts requested by each client business profile.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-500 border-collapse">
            <thead>
              <tr className="border-b border-slate-100 uppercase text-[10px] font-bold text-slate-400">
                <th className="py-3 px-4">Business Profile</th>
                <th className="py-3 px-4">Campaign Requests</th>
                <th className="py-3 px-4">AI Drafts generated</th>
                <th className="py-3 px-4 text-right">Quota Consumption</th>
              </tr>
            </thead>
            <tbody>
              {aiUsage.map((usage) => {
                const totalTokensWeight = (usage.draftsCount * 1.2) + (usage.requestsCount * 0.1);
                return (
                  <tr key={usage.businessId} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-800">{usage.businessName}</td>
                    <td className="py-3 px-4 font-mono font-bold">{usage.requestsCount}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{usage.draftsCount}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                        {totalTokensWeight.toFixed(1)} credits
                      </span>
                    </td>
                  </tr>
                );
              })}
              {aiUsage.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">
                    No active business usages recorded.
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
