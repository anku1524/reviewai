"use client";

import { useEffect, useState, use } from "react";
import { api } from "../../../lib/api";
import Link from "next/link";

type Location = {
  id: string;
  name: string;
  address: string;
  _count: { platformReviews: number; reviewRequests: number };
};

type BusinessMember = {
  id: string;
  role: string;
  user: { name: string; email: string };
};

type Subscription = {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
};

type BusinessDetail = {
  id: string;
  name: string;
  category: string;
  createdAt: string;
  owner: { name: string; email: string };
  locations: Location[];
  members: BusinessMember[];
  subscriptions: Subscription[];
};

export default function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetails();
  }, [id]);

  async function loadDetails() {
    setLoading(true);
    try {
      const data = await api.adminGetBusinessDetails(id);
      setBusiness(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load business details.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-slate-500 font-medium">Loading business profile details...</div>;
  }

  if (!business) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p className="font-bold">Business profile not found.</p>
        <Link href="/businesses" className="text-xs text-indigo-600 font-semibold underline mt-2 block">
          ↩️ Return to list
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6 text-left">
      <div>
        <Link href="/businesses" className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-bold uppercase">
          ↩️ Back to auditor list
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{business.name}</h1>
        <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wide font-bold">
          Category: {business.category} • Registered on {new Date(business.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left: General info */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Owner Profile</h3>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-extrabold text-slate-800">{business.owner.name}</span>
              <span className="text-xs text-slate-500 font-medium">{business.owner.email}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Subscription Status</h3>
            {business.subscriptions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No active subscription tier.</p>
            ) : (
              business.subscriptions.map((sub) => (
                <div key={sub.id} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-200 rounded px-2 py-0.5">
                      {sub.plan}
                    </span>
                    <span className="text-xs font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">
                      {sub.status}
                    </span>
                  </div>
                  {sub.currentPeriodEnd && (
                    <span className="text-[10px] text-slate-400 mt-1 font-bold">
                      Expires: {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Locations & Members */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Locations ({business.locations.length})</h3>
            <div className="flex flex-col gap-3">
              {business.locations.map((loc) => (
                <div key={loc.id} className="border border-slate-100 rounded-xl p-3.5 flex flex-col gap-1">
                  <span className="text-xs font-extrabold text-slate-800">{loc.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{loc.address}</span>
                  <div className="flex gap-4 mt-2 pt-2 border-t border-slate-50 text-[10px] text-slate-400 font-bold">
                    <span>📢 {loc._count.platformReviews} Reviews</span>
                    <span>📈 {loc._count.reviewRequests} Dispatches</span>
                  </div>
                </div>
              ))}
              {business.locations.length === 0 && (
                <p className="text-xs text-slate-400 italic">No physical locations configured.</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Staff Members ({business.members.length})</h3>
            <div className="flex flex-col gap-3">
              {business.members.map((member) => (
                <div key={member.id} className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800">{member.user.name}</span>
                    <span className="text-[10px] text-slate-400">{member.user.email}</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 border border-slate-200 bg-slate-50 rounded-md px-2.5 py-0.5">
                    {member.role}
                  </span>
                </div>
              ))}
              {business.members.length === 0 && (
                <p className="text-xs text-slate-400 italic">No auxiliary team members assigned.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
