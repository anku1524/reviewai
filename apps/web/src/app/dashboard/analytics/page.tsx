"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { EmptyState } from "../../../components/ui/EmptyState";

type LocationBreakdown = {
  id: string;
  name: string;
  address: string | null;
  totalRequests: number;
  totalReviews: number;
  avgRating: number | null;
};

type Business = { id: string; name: string };

function RatingBadge({ rating }: { rating: number | null }) {
  if (rating == null) return <span className="text-slate-400">—</span>;
  const color =
    rating >= 4.5 ? "bg-emerald-100 text-emerald-700"
    : rating >= 3.5 ? "bg-amber-100 text-amber-700"
    : "bg-rose-100 text-rose-700";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      {rating} ★
    </span>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [breakdown, setBreakdown] = useState<LocationBreakdown[]>([]);
  const [advancedData, setAdvancedData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"insights" | "locations">("insights");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    api.myBusinesses().then(async (businesses: Business[]) => {
      if (!businesses[0]) { setLoading(false); return; }
      setBusiness(businesses[0]);
      
      try {
        const [breakdownRes, advancedRes] = await Promise.all([
          api.getLocationBreakdown(businesses[0].id),
          api.getAdvancedAnalytics(businesses[0].id),
        ]);
        setBreakdown(breakdownRes);
        setAdvancedData(advancedRes);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      }
    }).catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="p-10 text-slate-500 font-sans">Loading analytics…</div>;

  const trends = advancedData?.trends || [];
  const wordCloud = advancedData?.wordCloud || [];
  const recommendations = advancedData?.recommendations || [];

  // SVG Chart points calculation
  const maxReviews = Math.max(...trends.map((t: any) => t.reviews), 5);
  const width = 500;
  const height = 200;
  const paddingX = 50;
  const paddingY = 30;

  const points = trends.map((t: any, idx: number) => {
    const x = paddingX + (idx / Math.max(trends.length - 1, 1)) * (width - paddingX * 2);
    const y = height - paddingY - (t.reviews / maxReviews) * (height - paddingY * 2);
    return { x, y, ...t };
  });

  const pathD = points.length > 0
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p: any) => `L ${p.x} ${p.y}`).join(" ")
    : "";
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : "";

  return (
    <div className="p-8 font-sans max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">Analytics Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">AI-driven sentiments and location performances</p>
        </div>
        
        {/* Toggle Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mt-4 sm:mt-0 self-start">
          <button
            onClick={() => setActiveTab("insights")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "insights" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🧠 AI Insights
          </button>
          <button
            onClick={() => setActiveTab("locations")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "locations" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            📍 Location Breakdown
          </button>
        </div>
      </div>

      {activeTab === "insights" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: Trend Graph & Sentiment distribution */}
          <div className="md:col-span-2 flex flex-col gap-6">
            
            {/* SVG Chart Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-800 mb-2 font-sans">Review Volume Trend</h2>
              <p className="text-xs text-slate-500 mb-6">Monthly review volumes over the last 6 months</p>
              
              {trends.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-sm text-slate-400">No trend data available</div>
              ) : (
                <div className="w-full">
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0"/>
                      </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#f1f5f9" strokeWidth="1" />
                    <line x1={paddingX} y1={(height) / 2} x2={width - paddingX} y2={(height) / 2} stroke="#f1f5f9" strokeWidth="1" />
                    <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#e2e8f0" strokeWidth="1.5" />

                    {/* Area fill */}
                    {areaD && <path d={areaD} fill="url(#chartGradient)" />}

                    {/* Line stroke */}
                    {pathD && <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

                    {/* Data dots */}
                    {points.map((p: any, idx: number) => (
                      <g key={idx} className="group cursor-pointer">
                        <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#6366f1" strokeWidth="3" />
                        <circle cx={p.x} cy={p.y} r="10" fill="#6366f1" fillOpacity="0.1" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        {/* Tooltip on hover */}
                        <text x={p.x} y={p.y - 12} textAnchor="middle" className="text-[10px] font-bold fill-slate-800 bg-white opacity-0 group-hover:opacity-100 transition-opacity">
                          {p.reviews} reviews ({p.avgRating}★)
                        </text>
                      </g>
                    ))}

                    {/* X Axis Labels */}
                    {points.map((p: any, idx: number) => {
                      const parts = p.month.split("-");
                      const monthLabel = parts[1] ? new Date(2026, parseInt(parts[1]) - 1).toLocaleString('en', { month: 'short' }) : p.month;
                      return (
                        <text key={idx} x={p.x} y={height - 10} textAnchor="middle" className="text-[10px] fill-slate-400 font-medium">
                          {monthLabel}
                        </text>
                      );
                    })}

                    {/* Y Axis Labels */}
                    <text x={paddingX - 10} y={paddingY + 4} textAnchor="end" className="text-[9px] fill-slate-400 font-bold">{maxReviews}</text>
                    <text x={paddingX - 10} y={height - paddingY + 4} textAnchor="end" className="text-[9px] fill-slate-400 font-bold">0</text>
                  </svg>
                </div>
              )}
            </div>

            {/* Keyword tag cloud */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-800 mb-2 font-sans">Customer Topic Clouds</h2>
              <p className="text-xs text-slate-500 mb-5">Recurring themes and topics sorted by customer sentiment</p>
              
              {wordCloud.length === 0 ? (
                <div className="py-8 flex items-center justify-center text-sm text-slate-400">Not enough review feedback text yet</div>
              ) : (
                <div className="flex flex-wrap gap-2.5 items-center justify-center py-4 bg-slate-50/50 rounded-xl px-4 border border-slate-100">
                  {wordCloud.map((w: any, idx: number) => {
                    const sentimentColor =
                      w.sentiment === "positive" ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      : w.sentiment === "negative" ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                      : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200";
                    
                    const fontSize =
                      w.value >= 80 ? "text-base font-bold px-3.5 py-1.5"
                      : w.value >= 50 ? "text-xs font-semibold px-2.5 py-1"
                      : "text-[10px] font-medium px-2 py-0.5";

                    return (
                      <span
                        key={idx}
                        className={`rounded-lg border shadow-sm transition-all duration-200 cursor-default ${sentimentColor} ${fontSize}`}
                        title={`Weight: ${w.value}% (${w.sentiment})`}
                      >
                        {w.text}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: AI Actionable Advice */}
          <div className="md:col-span-1 flex flex-col gap-6">
            
            {/* Operational Recommendations Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm h-full flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💡</span>
                <h2 className="text-base font-bold text-slate-800 font-sans">AI Operational Advice</h2>
              </div>
              <p className="text-xs text-slate-500 mb-6">Actionable suggestions generated by Gemini AI analyzing your reviews</p>

              {recommendations.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-slate-400 text-center py-12">
                  Add more reviews and feedback to generate operations advice.
                </div>
              ) : (
                <div className="flex flex-col gap-4 flex-1">
                  {recommendations.map((rec: any, idx: number) => {
                    const badgeColor =
                      rec.type === "staffing" ? "bg-blue-100 text-blue-800"
                      : rec.type === "service" ? "bg-amber-100 text-amber-800"
                      : rec.type === "quality" ? "bg-emerald-100 text-emerald-800"
                      : "bg-purple-100 text-purple-800";

                    return (
                      <div key={idx} className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 flex flex-col gap-2 hover:bg-slate-50 transition-colors">
                        <span className={`self-start text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeColor}`}>
                          {rec.type}
                        </span>
                        <p className="text-xs font-bold text-slate-800 leading-tight">{rec.recommendation}</p>
                        <div className="mt-1 border-t border-slate-100 pt-2 text-[10px] text-slate-500 leading-snug">
                          <strong>Evidence:</strong> {rec.rationale}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Breakdown Table tab */
        breakdown.length === 0 ? (
          <EmptyState
            title="No location data yet"
            description="Add locations and send review requests to see analytics here."
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs uppercase text-slate-400">
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Requests sent</th>
                  <th className="px-4 py-3">Reviews</th>
                  <th className="px-4 py-3">Conversion</th>
                  <th className="px-4 py-3">Avg rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {breakdown.map((loc) => {
                  const conversion =
                    loc.totalRequests > 0
                      ? Math.round((loc.totalReviews / loc.totalRequests) * 100)
                      : 0;
                  return (
                    <tr key={loc.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{loc.name}</p>
                        {loc.address && <p className="text-xs text-slate-400">{loc.address}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{loc.totalRequests}</td>
                      <td className="px-4 py-3 font-semibold">{loc.totalReviews}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-slate-800"
                              style={{ width: `${conversion}%` }}
                            />
                          </div>
                          <span className="text-slate-600">{conversion}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <RatingBadge rating={loc.avgRating} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
