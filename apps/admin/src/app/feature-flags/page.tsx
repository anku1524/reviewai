"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type FeatureFlag = {
  id: string;
  key: string;
  description: string;
  enabledPlans: string[];
  enabledForBusinessIds: string[];
  globallyEnabled: boolean;
  createdAt: string;
};

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  // New flag state
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newGloballyEnabled, setNewGloballyEnabled] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadFlags();
  }, []);

  async function loadFlags() {
    setLoading(true);
    try {
      const data = await api.adminListFeatureFlags();
      setFlags(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load feature flags.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleGlobal(flag: FeatureFlag) {
    try {
      const updated = await api.adminToggleFeatureFlag(flag.id, {
        globallyEnabled: !flag.globallyEnabled,
      });
      setFlags((prev) => prev.map((f) => (f.id === flag.id ? updated : f)));
    } catch (err) {
      console.error(err);
      alert("Failed to toggle global state.");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newKey.trim() || !newDesc.trim()) return;

    setCreating(true);
    try {
      const created = await api.adminCreateFeatureFlag({
        key: newKey.trim().toUpperCase(),
        description: newDesc,
        globallyEnabled: newGloballyEnabled,
      });
      setFlags((prev) => [created, ...prev]);
      setShowCreate(false);
      setNewKey("");
      setNewDesc("");
      setNewGloballyEnabled(false);
      alert("Feature flag registered successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to create feature flag.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-slate-500 font-medium">Loading feature flags...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6 text-left">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Feature Flags Console</h1>
          <p className="text-xs text-slate-500 mt-1">
            Activate or deactivate specific software elements globally or target specific subscription plans dynamically.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-xs font-bold transition shadow-md shadow-indigo-600/10"
        >
          {showCreate ? "Cancel Flag Creation" : "Register Feature Flag"}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-xl">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Register New Feature Flag</h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Flag Key ID</label>
              <input
                required
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g. EARLY_ACCESS_REPLIES"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
              <input
                required
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Brief summary of what this toggle enables..."
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="globally"
                checked={newGloballyEnabled}
                onChange={(e) => setNewGloballyEnabled(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <label htmlFor="globally" className="text-xs font-bold text-slate-700">
                Globally Enabled by Default
              </label>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2.5 text-xs font-bold transition shadow-md w-full mt-2"
            >
              {creating ? "Registering..." : "Submit Feature Flag"}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-500 border-collapse">
            <thead>
              <tr className="border-b border-slate-100 uppercase text-[10px] font-bold text-slate-400">
                <th className="py-3 px-4">Flag Details</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4">Global Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flags.map((flag) => (
                <tr key={flag.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="font-extrabold text-slate-800 tracking-wide font-mono text-xs">{flag.key}</span>
                      <span className="text-[10px] text-slate-450">{flag.description}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-400">
                    {new Date(flag.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                      flag.globallyEnabled
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                    }`}>
                      {flag.globallyEnabled ? "Globally Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleGlobal(flag)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md border transition-all ${
                        flag.globallyEnabled
                          ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      }`}
                    >
                      {flag.globallyEnabled ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
              {flags.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                    No custom feature flags configured yet.
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
