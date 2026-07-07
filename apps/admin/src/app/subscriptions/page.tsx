"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Subscription = {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  business: { id: string; name: string };
};

type Metrics = {
  totalMRR: number;
  proCount: number;
  freeCount: number;
  totalCount: number;
};

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function loadSubscriptions() {
    setLoading(true);
    try {
      const data = await api.adminListSubscriptions();
      setSubscriptions(data.subscriptions);
      setMetrics(data.metrics);
    } catch (err) {
      console.error(err);
      alert("Failed to load subscription metrics.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-slate-500 font-medium">Loading subscription accounts data...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Subscriptions Auditor</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor Monthly Recurring Revenue (MRR) tiers, Stripe sync logs, and override options globally.
        </p>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Estimated MRR</span>
            <div className="text-2xl font-black text-slate-900 mt-1">${metrics.totalMRR}</div>
            <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Calculated at $49/mo per Pro tier</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">PRO Active Accounts</span>
            <div className="text-2xl font-black text-indigo-600 mt-1">{metrics.proCount}</div>
            <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Paying clients subscriptions</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">FREE Active Accounts</span>
            <div className="text-2xl font-black text-slate-650 mt-1">{metrics.freeCount}</div>
            <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Basic plans registrations</span>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-950 mb-4">Subscription Audits Logs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-500 border-collapse">
            <thead>
              <tr className="border-b border-slate-100 uppercase text-[10px] font-bold text-slate-400">
                <th className="py-3 px-4">Business Client</th>
                <th className="py-3 px-4">Billing Status</th>
                <th className="py-3 px-4">Pricing Tier Plan</th>
                <th className="py-3 px-4">Period Expiry</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-bold text-slate-800">{sub.business.name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                      sub.status === "ACTIVE" || sub.status === "TRIALING"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-extrabold uppercase text-slate-700">{sub.plan}</span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-400">
                    {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleString() : "Never"}
                  </td>
                </tr>
              ))}
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                    No active billing registrations found.
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
