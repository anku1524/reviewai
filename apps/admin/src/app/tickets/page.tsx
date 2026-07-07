"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Ticket = {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  assignedTo: string | null;
  resolution: string | null;
  createdAt: string;
  business: { id: string; name: string };
  creator: { id: string; name: string; email: string } | null;
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // Resolution controls
  const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("RESOLVED");
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

  function startResolve(ticket: Ticket) {
    setResolvingTicketId(ticket.id);
    setNotes(ticket.resolution || "");
    setStatus(ticket.status);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!resolvingTicketId) return;

    setSaving(true);
    try {
      const updated = await api.adminUpdateTicket(resolvingTicketId, {
        status,
        resolution: notes,
      });

      // Update state
      setTickets((prev) =>
        prev.map((t) =>
          t.id === resolvingTicketId
            ? { ...t, status: updated.status, resolution: updated.resolution }
            : t
        )
      );

      setResolvingTicketId(null);
      setNotes("");
      alert("Ticket updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update ticket.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-slate-500 font-medium">Loading platform support desk...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Platform Support Tickets</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review, assign, and resolve assistance requests and bug reports raised by registered business owners.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Tickets Grid */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-500 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 uppercase text-[10px] font-bold text-slate-400">
                  <th className="py-3 px-4">Business & User</th>
                  <th className="py-3 px-4">Ticket Details</th>
                  <th className="py-3 px-4">Priority / Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5 text-left">
                        <span className="font-bold text-slate-800">{t.business.name}</span>
                        {t.creator ? (
                          <span className="text-[10px] text-slate-400 font-medium">
                            By: {t.creator.name} ({t.creator.email})
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">System Auto-raised</span>
                        )}
                        <span className="text-[9px] text-slate-400 mt-0.5 font-mono">
                          {new Date(t.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 max-w-[280px]">
                        <span className="font-bold text-slate-800">{t.title}</span>
                        <p className="text-[11px] text-slate-500 italic line-clamp-2">
                          "{t.description}"
                        </p>
                        {t.resolution && (
                          <div className="bg-emerald-50/50 border border-emerald-100 p-2 rounded text-[9px] text-slate-600 mt-1">
                            <span className="font-bold uppercase text-[8px] text-emerald-500 block mb-0.5">Admin Reply</span>
                            {t.resolution}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                          t.priority === "URGENT"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : t.priority === "HIGH"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}>
                          {t.priority}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                          t.status === "RESOLVED" || t.status === "resolved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => startResolve(t)}
                        className="text-[10px] font-bold border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-md"
                      >
                        Reply / Resolve
                      </button>
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                      No support tickets raised currently.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Resolution form */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-0.5">Resolution Center</h2>
            <p className="text-[11px] text-slate-400 font-medium">
              Submit answers, write guidelines, or close help desk tickets.
            </p>
          </div>

          {resolvingTicketId ? (
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Set Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none"
                >
                  <option value="OPEN">Open (Pending investigation)</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved (Close ticket)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Response Message</label>
                <textarea
                  required
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter response or resolution details for the business client..."
                  className="rounded-lg border border-slate-300 bg-white p-3 text-xs focus:outline-none focus:border-indigo-500"
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
                  {saving ? "Saving..." : "Submit Answer"}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-medium">
              Select a support ticket to reply.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
