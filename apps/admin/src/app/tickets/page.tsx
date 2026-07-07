"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Ticket = {
  id: string;
  status: string;
  assignee: string | null;
  resolution: string | null;
  createdAt: string;
  business: { id: string; name: string };
  location: { id: string; name: string };
  rating: {
    id: string;
    stars: number;
    feedback: string | null;
  };
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // Resolution modal states
  const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);
    try {
      const list = await api.adminListGlobalTickets();
      setTickets(list);
    } catch (err) {
      console.error("Failed to load global support tickets:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(e: React.FormEvent) {
    e.preventDefault();
    if (!resolvingTicketId) return;

    const targetTicket = tickets.find((t) => t.id === resolvingTicketId);
    if (!targetTicket) return;

    setSaving(true);
    try {
      await api.updateTicket(targetTicket.business.id, resolvingTicketId, {
        status: "resolved",
        resolution: notes,
      });
      setTickets((prev) =>
        prev.map((t) =>
          t.id === resolvingTicketId
            ? { ...t, status: "resolved", resolution: notes }
            : t
        )
      );
      setResolvingTicketId(null);
      setNotes("");
    } catch (err) {
      console.error(err);
      alert("Failed to resolve ticket.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-slate-500 font-medium">Loading platform escalations board...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Global Customer Escalations</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor negative feedback escalations and resolve store complaints across all registered business profiles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left/Middle Column: Global tickets list */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-500 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 uppercase text-[10px] font-bold text-slate-400">
                  <th className="py-3 px-4">Business & Location</th>
                  <th className="py-3 px-4">Complaint / Feedback</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5 text-left">
                        <span className="font-bold text-slate-800">{t.business.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Loc: {t.location.name}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          Filed: {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 max-w-[280px]">
                        <span className="text-rose-600 font-bold font-mono">
                          {Array.from({ length: t.rating.stars }).map(() => "★").join("")}
                        </span>
                        <p className="text-[11px] text-slate-600 italic line-clamp-2">
                          "{t.rating.feedback || "No written text feedback provided."}"
                        </p>
                        {t.resolution && (
                          <div className="bg-slate-50 border border-slate-150 p-2 rounded text-[9px] text-slate-500 mt-1">
                            <span className="font-bold uppercase text-[8px] text-slate-400 block mb-0.5">Resolution Notes</span>
                            {t.resolution}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {t.status === "resolved" ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700 uppercase">
                          Resolved
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-700 uppercase">
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {t.status !== "resolved" && (
                        <button
                          onClick={() => setResolvingTicketId(t.id)}
                          className="text-[10px] font-bold border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 px-2.5 py-1 rounded-md"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                      No unresolved customer escalations.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Resolution Panel */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-0.5">Ticket Settlement</h2>
            <p className="text-[11px] text-slate-400 font-medium">
              Submit resolution parameters and mark customer store complaints settled.
            </p>
          </div>

          {resolvingTicketId ? (
            <form onSubmit={handleResolve} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Resolution Details</label>
                <textarea
                  required
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white p-3 text-xs focus:outline-none focus:border-indigo-500"
                  placeholder="Enter details (e.g., Refund issued, customer service followed up...)"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingTicketId(null)}
                  className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg py-2 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 text-xs font-bold transition shadow-md"
                >
                  {saving ? "Saving..." : "Close Ticket"}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-medium">
              Select a pending ticket to submit resolution notes.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
