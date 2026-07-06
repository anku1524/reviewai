"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

type Ticket = {
  id: string;
  locationId: string;
  location: { name: string };
  ratingId: string;
  rating: {
    stars: number;
    feedback: string;
    createdAt: string;
    reviewRequest: {
      customer: {
        name: string;
        email?: string;
        phone?: string;
      };
    };
  };
  status: string;
  assignedTo?: string;
  resolution?: string;
  createdAt: string;
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filter settings
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);

  // Update form settings
  const [editStatus, setEditStatus] = useState("OPEN");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editResolution, setEditResolution] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const businesses = await api.myBusinesses();
      if (businesses[0]) {
        const list = await api.listTickets(businesses[0].id);
        setTickets(list);
        setFilteredTickets(list);

        // Fetch locations for filters
        const locs = await api.listLocations(businesses[0].id);
        setLocations(locs);

        if (list.length > 0) {
          selectTicket(list[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load ticketing records:", err);
    } finally {
      setLoading(false);
    }
  }

  function selectTicket(ticket: Ticket) {
    setSelectedTicket(ticket);
    setEditStatus(ticket.status);
    setEditAssignedTo(ticket.assignedTo || "");
    setEditResolution(ticket.resolution || "");
    setMessage(null);
  }

  // Handle updates
  async function handleSaveResolution(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicket) return;

    setSaving(true);
    setMessage(null);
    try {
      const businesses = await api.myBusinesses();
      const updated = await api.updateTicket(businesses[0].id, selectedTicket.id, {
        status: editStatus,
        assignedTo: editAssignedTo,
        resolution: editResolution,
      });

      // Update state
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setFilteredTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setSelectedTicket(updated);
      setMessage("Ticket resolution details updated successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to update ticket.");
    } finally {
      setSaving(false);
    }
  }

  // Apply filters
  useEffect(() => {
    let result = tickets;

    if (statusFilter !== "ALL") {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (locationFilter !== "ALL") {
      result = result.filter((t) => t.locationId === locationFilter);
    }

    setFilteredTickets(result);
  }, [statusFilter, locationFilter, tickets]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading resolution dashboard...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Negative Feedback Escalations</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor and resolve low rating entries (&lt; 3★) routed privately to your staff before they reach public networks.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex flex-col gap-1 text-left">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Filter Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">🔴 Open</option>
            <option value="IN_PROGRESS">🟡 In Progress</option>
            <option value="RESOLVED">🟢 Resolved</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 text-left">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Filter Location</label>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          No negative rating escalations found. Outstanding! Your customer satisfaction is optimal.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Left: Ticket Selector List */}
          <div className="md:col-span-1 flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredTickets.map((t) => {
              const customerName = t.rating.reviewRequest.customer?.name || "Anonymous Customer";
              const isSelected = selectedTicket?.id === t.id;

              return (
                <button
                  key={t.id}
                  onClick={() => selectTicket(t)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-2 ${
                    isSelected 
                      ? "bg-slate-900 border-slate-950 text-white shadow-md" 
                      : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-bold truncate max-w-[120px]">{customerName}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                      t.status === "RESOLVED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : t.status === "IN_PROGRESS"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <p className={`text-[10px] italic line-clamp-2 leading-relaxed ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                    "{t.rating.feedback || "Private low rating submission."}"
                  </p>

                  <div className="flex justify-between items-center text-[9px] border-t pt-2 mt-1 border-slate-100/10">
                    <span className={isSelected ? "text-slate-400" : "text-slate-400"}>{t.location.name}</span>
                    <span className="text-amber-500 font-bold">{t.rating.stars}★</span>
                  </div>
                </button>
              );
            })}
            {filteredTickets.length === 0 && (
              <p className="text-xs text-slate-400 italic py-6 text-center">No matching tickets for chosen filters.</p>
            )}
          </div>

          {/* Right: Ticket Detail & Resolving Form */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            {selectedTicket ? (
              <form onSubmit={handleSaveResolution} className="flex flex-col gap-5 text-left">
                
                {/* Header detail */}
                <div className="flex justify-between items-start border-b pb-4 gap-4 flex-wrap">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Customer Information</span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {selectedTicket.rating.reviewRequest.customer?.name || "Anonymous Customer"}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {selectedTicket.rating.reviewRequest.customer?.email || "No email"} • {selectedTicket.rating.reviewRequest.customer?.phone || "No phone"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Captured At</span>
                    <p className="text-xs text-slate-700 font-medium">
                      {new Date(selectedTicket.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {message && (
                  <div className="p-3 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold">
                    {message}
                  </div>
                )}

                {/* Rating & Feedback */}
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Customer Feedback ({selectedTicket.rating.stars}★)</span>
                    <span className="text-xs text-amber-500">
                      {Array.from({ length: selectedTicket.rating.stars }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 italic leading-relaxed">
                    "{selectedTicket.rating.feedback || "No written comment provided."}"
                  </p>
                </div>

                {/* Updating Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Resolution Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none"
                    >
                      <option value="OPEN">🔴 Open</option>
                      <option value="IN_PROGRESS">🟡 In Progress</option>
                      <option value="RESOLVED">🟢 Resolved</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Assigned Manager</label>
                    <input
                      type="text"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none"
                      placeholder="e.g. manager@cafe.dev"
                      value={editAssignedTo}
                      onChange={(e) => setEditAssignedTo(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Internal Resolution Notes</label>
                  <textarea
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 p-3 text-xs focus:outline-none focus:border-indigo-500"
                    placeholder="Describe how the complaint was resolved (e.g. sent 20% discount coupon, resolved invoice error, called and apologized)."
                    value={editResolution}
                    onChange={(e) => setEditResolution(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2.5 text-xs font-bold transition-all w-full mt-2 shadow"
                >
                  {saving ? "Saving Resolution..." : "Save Resolution details"}
                </button>

              </form>
            ) : (
              <p className="text-xs text-slate-400 italic py-12 text-center">Select an escalation ticket to start resolving.</p>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
