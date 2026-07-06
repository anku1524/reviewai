"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

type Competitor = {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
};

export default function CompetitorsPage() {
  const [business, setBusiness] = useState<any>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [ownData, setOwnData] = useState<{ rating: number; count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Manual Add Form
  const [newName, setNewName] = useState("");
  const [newRating, setNewRating] = useState("4.3");
  const [newReviews, setNewReviews] = useState("50");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const businessesRes = await api.myBusinesses();
      if (businessesRes[0]) {
        const activeBusiness = businessesRes[0];
        setBusiness(activeBusiness);

        // Fetch own ratings
        const widgetRes = await api.getPublicWidgetData(activeBusiness.id);
        setOwnData({
          rating: widgetRes.averageRating || 4.8,
          count: widgetRes.totalReviews || 120,
        });

        // Fetch competitors
        const compList = await api.listCompetitors(activeBusiness.id);
        setCompetitors(compList);
      }
    } catch (err) {
      console.error("Failed to load competitors panel:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    if (!business) return;
    setSyncing(true);
    try {
      const synced = await api.syncCompetitors(business.id);
      setCompetitors(synced);
    } catch (err) {
      console.error("Failed to sync competitors:", err);
      alert("Simulated sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleAddCompetitor(e: React.FormEvent) {
    e.preventDefault();
    if (!business || !newName.trim()) return;

    setAdding(true);
    try {
      const created = await api.createCompetitor(business.id, {
        name: newName,
        rating: parseFloat(newRating),
        reviewCount: parseInt(newReviews),
      });
      setCompetitors((prev) => [...prev, created].sort((a, b) => b.reviewCount - a.reviewCount));
      setNewName("");
    } catch (err) {
      console.error(err);
      alert("Failed to add competitor.");
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading competitors benchmark dashboard...</div>;
  }

  if (!business) {
    return <div className="p-8 text-slate-500 font-medium text-center">Please configure a business location workspace first.</div>;
  }

  // Combine datasets for ranking
  const players = [
    {
      name: `${business.name} (You)`,
      rating: ownData?.rating || 4.8,
      reviewCount: ownData?.count || 120,
      isSelf: true,
    },
    ...competitors.map((c) => ({
      name: c.name,
      rating: c.rating,
      reviewCount: c.reviewCount,
      isSelf: false,
    })),
  ].sort((a, b) => b.reviewCount - a.reviewCount);

  // Find own rank
  const ownRankIndex = players.findIndex((p) => p.isSelf);
  const ownRank = ownRankIndex !== -1 ? ownRankIndex + 1 : 1;

  // Max review count for bar sizing calculation
  const maxReviews = Math.max(...players.map((p) => p.reviewCount), 10);

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Competitor Benchmarking</h1>
          <p className="text-xs text-slate-500 mt-1">
            Compare review counts, average ratings, and local ranking against nearby competitors.
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all shadow disabled:opacity-50"
        >
          {syncing ? "Scanning Maps Database..." : "Find Nearby Competitors"}
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Local Ranking Position</span>
          <h3 className="text-2xl font-black text-slate-900">Rank #{ownRank}</h3>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Out of {players.length} competitors in your area</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Average Rating Lead</span>
          <h3 className="text-2xl font-black text-emerald-600">{(ownData?.rating || 4.8).toFixed(1)} ★</h3>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Top tier ranking standard locally</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Market Competitors</span>
          <h3 className="text-2xl font-black text-slate-900">{competitors.length} Synced</h3>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Mapped from Google Maps Search</p>
        </div>

      </div>

      {/* Comparisons Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Benchmarks lists & charts */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Card: Review count benchmark */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <h2 className="text-sm font-bold text-slate-900">Review Volume Comparison</h2>
            
            <div className="flex flex-col gap-4">
              {players.map((p, idx) => {
                const widthPercent = Math.max(10, (p.reviewCount / maxReviews) * 100);

                return (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className={`font-bold ${p.isSelf ? "text-indigo-600" : "text-slate-800"}`}>
                        {p.name}
                      </span>
                      <span className="font-mono font-bold text-slate-500">{p.reviewCount} reviews</span>
                    </div>

                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          p.isSelf ? "bg-indigo-600" : "bg-slate-400"
                        }`}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: Ratings comparison */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <h2 className="text-sm font-bold text-slate-900">Average Ratings comparison</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {players.map((p, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex justify-between items-center ${
                    p.isSelf 
                      ? "bg-indigo-50/50 border-indigo-200 text-indigo-900" 
                      : "bg-slate-50/50 border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {p.isSelf ? "Your business" : "Competitor"}
                    </span>
                    <span className="text-xs font-bold truncate max-w-[140px]">{p.name}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black">{p.rating.toFixed(1)} ★</span>
                    <span className="text-[9px] text-amber-500">★★★★★</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Add Custom competitor manual form */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Add Competitor Manually</h2>
          <p className="text-[11px] text-slate-400 mb-4 font-medium">
            Monitor a local competitor that was not automatically discovered on map scans.
          </p>

          <form onSubmit={handleAddCompetitor} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Competitor Name</label>
              <input
                type="text"
                required
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none"
                placeholder="e.g. Bean Counter Inc."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Map Rating</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none"
                  value={newRating}
                  onChange={(e) => setNewRating(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Review Count</label>
                <input
                  type="number"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none"
                  value={newReviews}
                  onChange={(e) => setNewReviews(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={adding}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2.5 text-xs font-bold transition-all w-full mt-2"
            >
              {adding ? "Adding..." : "Add Competitor Profile"}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
