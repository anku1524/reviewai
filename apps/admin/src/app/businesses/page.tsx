"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Subscription = {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
};

type Business = {
  id: string;
  name: string;
  owner: { id: string; name: string; email: string };
  locations: Array<{ id: string; name: string; _count: { platformReviews: number } }>;
  subscriptions: Subscription[];
};

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Subscription Form states
  const [editingBusinessId, setEditingBusinessId] = useState<string | null>(null);
  const [plan, setPlan] = useState("pro");
  const [status, setStatus] = useState("ACTIVE");
  const [periodEnd, setPeriodEnd] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBusinesses();
  }, []);

  async function loadBusinesses() {
    setLoading(true);
    try {
      const list = await api.adminListBusinesses();
      setBusinesses(list);
    } catch (err) {
      console.error("Failed to load business registries:", err);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(business: Business) {
    setEditingBusinessId(business.id);
    const sub = business.subscriptions[0];
    setPlan(sub?.plan || "pro");
    setStatus(sub?.status || "ACTIVE");
    if (sub?.currentPeriodEnd) {
      setPeriodEnd(new Date(sub.currentPeriodEnd).toISOString().split("T")[0]);
    } else {
      setPeriodEnd("");
    }
  }

  async function handleSaveSubscription(e: React.FormEvent) {
    e.preventDefault();
    if (!editingBusinessId) return;

    setSaving(true);
    try {
      const updated = await api.adminOverrideSubscription(editingBusinessId, {
        plan,
        status,
        currentPeriodEnd: periodEnd || undefined,
      });

      // Update local state
      setBusinesses((prev) =>
        prev.map((b) => {
          if (b.id === editingBusinessId) {
            return {
              ...b,
              subscriptions: [updated],
            };
          }
          return b;
        })
      );

      setEditingBusinessId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to override subscription.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-slate-500 font-medium">Loading business auditor console...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Business & Billing Auditor</h1>
        <p className="text-xs text-slate-500 mt-1">
          Audit business installations, check mapped locations, or manually override subscription packages.
        </p>
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Businesses grid */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-500 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 uppercase text-[10px] font-bold text-slate-400">
                  <th className="py-3 px-4">Business & Owner</th>
                  <th className="py-3 px-4">Locations</th>
                  <th className="py-3 px-4">Subscription</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => {
                  const sub = b.subscriptions[0];
                  return (
                    <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5 text-left">
                          <span className="font-bold text-slate-800">{b.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Owner: {b.owner.name} ({b.owner.email})
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {b.locations.map((loc) => (
                            <div key={loc.id} className="flex justify-between items-center gap-2 text-[10px] text-slate-500 font-medium">
                              <span className="truncate max-w-[120px]">{loc.name}</span>
                              <span className="font-mono text-slate-400">({loc._count.platformReviews} reviews)</span>
                            </div>
                          ))}
                          {b.locations.length === 0 && (
                            <span className="text-[10px] text-slate-400 italic">No locations</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-[10px] font-bold uppercase ${
                            sub?.plan === "pro" ? "text-indigo-600" : "text-slate-500"
                          }`}>
                            {sub?.plan || "free"} plan
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium font-mono uppercase">
                            {sub?.status || "TRIALING"}
                          </span>
                          {sub?.currentPeriodEnd && (
                            <span className="text-[9px] text-slate-400">
                              Ends: {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => startEdit(b)}
                          className="text-[10px] font-bold border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-md"
                        >
                          Modify Billing
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Edit subscription details form */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-0.5">Override Billing</h2>
            <p className="text-[11px] text-slate-400 font-medium">
              Manually modify pricing levels and parameters for the selected business profile.
            </p>
          </div>

          {editingBusinessId ? (
            <form onSubmit={handleSaveSubscription} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Subscription Tier</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none"
                >
                  <option value="free">Free Trial</option>
                  <option value="pro">Enterprise Pro</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Stripe Status Override</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none"
                >
                  <option value="ACTIVE">Active (Paid)</option>
                  <option value="TRIALING">Trialing</option>
                  <option value="PAST_DUE">Past Due (Delinquent)</option>
                  <option value="CANCELED">Canceled</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Period End Date</label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingBusinessId(null)}
                  className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg py-2 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 text-xs font-bold transition"
                >
                  {saving ? "Saving..." : "Apply Override"}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-medium">
              Select a business to apply manual billing overrides.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
