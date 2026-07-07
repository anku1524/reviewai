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

export default function PlatformTicketsWorkspace() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Form states for the active incident
  const [ticketState, setTicketState] = useState("");
  const [ticketPriority, setTicketPriority] = useState("");
  const [assignedToAgent, setAssignedToAgent] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);
    try {
      const list = await api.adminListGlobalTickets();
      setTickets(list);
      setFilteredTickets(list);
      if (list.length > 0) {
        selectTicket(list[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function selectTicket(ticket: Ticket) {
    setSelectedTicket(ticket);
    setTicketState(ticket.status);
    setTicketPriority(ticket.priority);
    setAssignedToAgent(ticket.assignedTo || "");
    setResolutionNotes(ticket.resolution || "");
  }

  // Handle live search and filter matching
  useEffect(() => {
    let result = tickets;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          (t.creator?.email || "").toLowerCase().includes(q) ||
          t.business.name.toLowerCase().includes(q)
      );
    }

    if (stateFilter !== "ALL") {
      result = result.filter((t) => t.status === stateFilter);
    }

    if (priorityFilter !== "ALL") {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    setFilteredTickets(result);
  }, [searchQuery, stateFilter, priorityFilter, tickets]);

  async function handleUpdateIncident(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicket) return;

    setSaving(true);
    try {
      const updated = await api.adminUpdateTicket(selectedTicket.id, {
        status: ticketState,
        assignedTo: assignedToAgent,
        resolution: resolutionNotes,
      });

      // Update state arrays
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? { ...t, ...updated } : t))
      );
      setSelectedTicket((prev) => (prev ? { ...prev, ...updated } : null));
      alert(`Incident INC-${selectedTicket.id.slice(-6).toUpperCase()} updated successfully.`);
    } catch (err) {
      console.error(err);
      alert("Failed to update incident.");
    } finally {
      setSaving(false);
    }
  }

  // Helper formatting values ServiceNow-style
  function formatIncidentNumber(id: string) {
    return `INC${id.slice(-6).toUpperCase()}`;
  }

  function formatPriorityLabel(priority: string) {
    switch (priority) {
      case "URGENT":
        return "1 - Critical";
      case "HIGH":
        return "2 - High";
      case "MEDIUM":
        return "3 - Moderate";
      case "LOW":
      default:
        return "4 - Low";
    }
  }

  function formatStateLabel(status: string) {
    switch (status) {
      case "RESOLVED":
        return "Resolved";
      case "IN_PROGRESS":
        return "In Progress";
      case "OPEN":
      default:
        return "New";
    }
  }

  if (loading) {
    return <div className="p-8 text-slate-500 font-medium">Loading platform support incidents...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[#f4f5f7] text-left text-xs font-sans text-[#1f2d3d]">
      
      {/* ServiceNow Header Ribbon */}
      <div className="bg-[#1f2d3d] text-white px-6 py-3.5 flex justify-between items-center border-b border-[#0f1b2b]">
        <div className="flex items-center gap-3">
          <span className="text-base font-black tracking-wider text-emerald-400">service<span className="text-white font-normal">now</span></span>
          <span className="text-slate-400">|</span>
          <h1 className="font-extrabold text-sm uppercase tracking-wider text-slate-100">Incidents Workspace</h1>
        </div>
      </div>

      {/* Filter and Search Bar Ribbon */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search incident logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-[#bec8d2] bg-white rounded px-3 py-1.5 text-xs w-64 focus:outline-none focus:border-[#4f80b0]"
          />

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="border border-[#bec8d2] bg-white rounded px-2.5 py-1.5 text-xs focus:outline-none font-bold text-slate-700"
          >
            <option value="ALL">All States</option>
            <option value="OPEN">New</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-[#bec8d2] bg-white rounded px-2.5 py-1.5 text-xs focus:outline-none font-bold text-slate-700"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">1 - Critical</option>
            <option value="HIGH">2 - High</option>
            <option value="MEDIUM">3 - Moderate</option>
            <option value="LOW">4 - Low</option>
          </select>
        </div>

        <span className="text-slate-400 font-bold text-[10px]">
          Showing {filteredTickets.length} of {tickets.length} Incidents
        </span>
      </div>

      {/* Main Workspace Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-[calc(100vh-95px)]">
        
        {/* Left Column: ServiceNow List View */}
        <div className="lg:col-span-7 bg-white border-r border-slate-200 overflow-y-auto h-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f4f5f7] border-b border-[#bec8d2] text-[#485b6f] font-extrabold uppercase text-[9px] tracking-wider select-none">
                <th className="py-2.5 px-4 border-r border-[#bec8d2]/60">Number</th>
                <th className="py-2.5 px-4 border-r border-[#bec8d2]/60">Caller</th>
                <th className="py-2.5 px-4 border-r border-[#bec8d2]/60">Short Description</th>
                <th className="py-2.5 px-4 border-r border-[#bec8d2]/60">State</th>
                <th className="py-2.5 px-4 border-r border-[#bec8d2]/60">Priority</th>
                <th className="py-2.5 px-4">Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <tr
                    key={t.id}
                    onClick={() => selectTicket(t)}
                    className={`border-b border-[#e6ecf1] hover:bg-[#eef5fc] cursor-pointer transition-colors ${
                      isSelected ? "bg-[#e2edf8] font-bold" : ""
                    }`}
                  >
                    <td className="py-3 px-4 border-r border-[#bec8d2]/30 text-[#4f80b0] font-mono">
                      {formatIncidentNumber(t.id)}
                    </td>
                    <td className="py-3 px-4 border-r border-[#bec8d2]/30 truncate max-w-[120px]">
                      {t.creator?.name || "System"}
                    </td>
                    <td className="py-3 px-4 border-r border-[#bec8d2]/30 font-medium truncate max-w-[180px]">
                      {t.title}
                    </td>
                    <td className="py-3 px-4 border-r border-[#bec8d2]/30">
                      <span className={`px-2 py-0.5 rounded-[3px] text-[8px] font-black uppercase border ${
                        t.status === "RESOLVED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : t.status === "IN_PROGRESS"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}>
                        {formatStateLabel(t.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-r border-[#bec8d2]/30 text-slate-700">
                      {formatPriorityLabel(t.priority)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {t.assignedTo || "Unassigned"}
                    </td>
                  </tr>
                );
              })}
              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No active incident records matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right Column: ServiceNow Detail Panel */}
        <div className="lg:col-span-5 bg-[#fafbfb] overflow-y-auto h-full p-6 text-left flex flex-col gap-5">
          {selectedTicket ? (
            <form onSubmit={handleUpdateIncident} className="flex flex-col gap-4">
              
              {/* Form header */}
              <div className="flex justify-between items-center border-b border-[#bec8d2] pb-3 mb-2">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-base font-extrabold text-slate-800">
                    {formatIncidentNumber(selectedTicket.id)}
                  </span>
                  <span className="text-[10px] text-slate-450 font-bold uppercase">
                    Incident Form view
                  </span>
                </div>
              </div>

              {/* Read-only Caller Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-550 uppercase">Caller</label>
                  <input
                    readOnly
                    type="text"
                    value={selectedTicket.creator?.name || "System"}
                    className="border border-[#bec8d2] rounded px-3 py-2 text-xs font-semibold bg-[#e6ecf1] cursor-not-allowed outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-550 uppercase">Caller Email</label>
                  <input
                    readOnly
                    type="text"
                    value={selectedTicket.creator?.email || "N/A"}
                    className="border border-[#bec8d2] rounded px-3 py-2 text-xs font-semibold bg-[#e6ecf1] cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Business Account</label>
                <input
                  readOnly
                  type="text"
                  value={selectedTicket.business.name}
                  className="border border-[#bec8d2] rounded px-3 py-2 text-xs font-semibold bg-[#e6ecf1] cursor-not-allowed outline-none"
                />
              </div>

              <div className="flex flex-col gap-1 border-t border-slate-200/60 pt-3">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Short Description</label>
                <input
                  readOnly
                  type="text"
                  value={selectedTicket.title}
                  className="border border-[#bec8d2] rounded px-3 py-2 text-xs font-semibold bg-[#e6ecf1] cursor-not-allowed outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Description (Detailed)</label>
                <textarea
                  readOnly
                  rows={4}
                  value={selectedTicket.description}
                  className="border border-[#bec8d2] rounded p-3 text-xs font-semibold bg-[#e6ecf1] cursor-not-allowed outline-none resize-none"
                />
              </div>

              {/* State and Assignment */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-200/60 pt-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-550 uppercase">State</label>
                  <select
                    value={ticketState}
                    onChange={(e) => setTicketState(e.target.value)}
                    className="border border-[#bec8d2] bg-white rounded px-2.5 py-2 text-xs font-semibold focus:outline-none"
                  >
                    <option value="OPEN">New</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-550 uppercase">Assigned To</label>
                  <input
                    type="text"
                    value={assignedToAgent}
                    onChange={(e) => setAssignedToAgent(e.target.value)}
                    placeholder="Enter assignee name or group"
                    className="border border-[#bec8d2] rounded bg-white px-3 py-2 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Resolution Notes</label>
                <textarea
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Explain incident solution actions or resolution guidelines..."
                  className="border border-[#bec8d2] bg-white rounded p-3 text-xs font-semibold focus:outline-none resize-none focus:border-[#4f80b0]"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="bg-[#278e27] hover:bg-[#207a20] text-white rounded py-2.5 font-bold text-xs shadow-md transition-colors w-full mt-2"
              >
                {saving ? "Updating Incident..." : "Update Incident Details"}
              </button>

            </form>
          ) : (
            <div className="h-full flex items-center justify-center p-8 text-slate-400 font-medium italic border border-dashed border-slate-200 rounded-xl">
              Select an incident from the list to load workspace variables.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
