"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

type Ticket = {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  resolution: string | null;
  createdAt: string;
  creator?: { name: string; email: string };
};

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // New ticket fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);
    try {
      const businesses = await api.myBusinesses();
      if (businesses[0]) {
        const list = await api.listTickets(businesses[0].id);
        setTickets(list);
      }
    } catch (err) {
      console.error("Failed to load support tickets list:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const businesses = await api.myBusinesses();
      if (businesses[0]) {
        const created = await api.createTicket(businesses[0].id, {
          title,
          description,
          priority,
        });
        setTickets((prev) => [created, ...prev]);
        setShowForm(false);
        setTitle("");
        setDescription("");
        setPriority("MEDIUM");
        alert("Support ticket raised successfully! Our administration team will look into it shortly.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit support ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading support center...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6 text-left">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Support Desk</h1>
          <p className="text-xs text-slate-500 mt-1">
            Need help or facing an issue? Raise a support ticket directly to our platform engineering and support teams.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-xs font-bold transition shadow-md shadow-indigo-600/10"
        >
          {showForm ? "View Active Tickets" : "Raise New Ticket"}
        </button>
      </div>

      {showForm ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-2xl">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Submit Help Request</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Issue Title</label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue (e.g. Cannot connect Google location)"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Severity Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none"
                >
                  <option value="LOW">Low (General question)</option>
                  <option value="MEDIUM">Medium (Bug or problem)</option>
                  <option value="HIGH">High (Feature not working)</option>
                  <option value="URGENT">Urgent (Platform blocking)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Describe Your Problem</label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include step-by-step description and details of the issues you are facing..."
                className="rounded-lg border border-slate-300 bg-white p-3 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-2 justify-end mt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-5 py-2 text-xs font-bold transition shadow-md"
              >
                {submitting ? "Submitting..." : "Submit Support Ticket"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {tickets.map((t) => (
            <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-slate-800">{t.title}</span>
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
                      t.status === "resolved" || t.status === "RESOLVED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">
                    Ticket ID: {t.id} • Raised on {new Date(t.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-3">
                {t.description}
              </p>

              {t.resolution ? (
                <div className="border-t border-slate-100 pt-3 flex flex-col gap-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-600">🛡️</span>
                    <span className="font-bold text-slate-800">Support Agent Resolution:</span>
                  </div>
                  <p className="italic bg-emerald-50/40 border border-emerald-100 rounded-xl p-3 text-slate-600">
                    {t.resolution}
                  </p>
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 font-medium italic mt-1">
                  ⏳ Awaiting response from platform administrators.
                </div>
              )}
            </div>
          ))}

          {tickets.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 font-medium">
              No tickets raised. Need assistance? Click "Raise New Ticket" above!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
