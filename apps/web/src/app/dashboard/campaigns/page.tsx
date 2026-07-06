"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../../lib/api";

type Me = { name: string; email: string; role: string };
type Business = { id: string; name: string };
type Location = { id: string; name: string };

type Campaign = {
  id: string;
  name: string;
  channel: string;
  createdAt: string;
  _count: { reviewRequests: number };
  reviewRequests: Array<{
    status: string;
    rating?: { stars: number };
  }>;
};

export default function CampaignsPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // New Campaign Form Modal
  const [showModal, setShowModal] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [channel, setChannel] = useState("EMAIL");
  const [locationId, setLocationId] = useState("");
  const [customersText, setCustomersText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    Promise.all([api.me(), api.myBusinesses()])
      .then(([meRes, businessesRes]) => {
        setMe(meRes);
        setBusinesses(businessesRes);
        if (businessesRes.length > 0) {
          setSelectedBusiness(businessesRes[0]);
        } else {
          setLoading(false);
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    if (!selectedBusiness) return;

    setLoading(true);
    Promise.all([
      api.listLocations(selectedBusiness.id),
      api.listCampaigns(selectedBusiness.id),
    ])
      .then(([locsRes, campaignsRes]) => {
        setLocations(locsRes);
        setCampaigns(campaignsRes);
        if (locsRes.length > 0) {
          setLocationId(locsRes[0].id);
        }
      })
      .catch((err) => console.error("Error loading campaigns:", err))
      .finally(() => setLoading(false));
  }, [selectedBusiness]);

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBusiness || !locationId) return;

    // Parse customers
    const lines = customersText.split("\n");
    const parsedCustomers = lines
      .map((line) => {
        const parts = line.split(",").map((x) => x.trim());
        const name = parts[0];
        const contact = parts[1];
        if (!name) return null;

        const isEmail = contact ? contact.includes("@") : false;
        const result: { name: string; email?: string; phone?: string } = {
          name,
          ...(isEmail ? { email: contact } : { phone: contact }),
        };
        return result;
      })
      .filter((x): x is { name: string; email?: string; phone?: string } => x !== null);

    if (parsedCustomers.length === 0) {
      alert("Please enter at least one customer (e.g. John Doe, john@example.com)");
      return;
    }

    setSubmitting(true);
    try {
      await api.createCampaign(selectedBusiness.id, {
        name: campaignName,
        channel,
        locationId,
        customers: parsedCustomers,
      });

      // Refresh campaigns list
      const updated = await api.listCampaigns(selectedBusiness.id);
      setCampaigns(updated);

      // Reset
      setCampaignName("");
      setCustomersText("");
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to create campaign.");
    } finally {
      setSubmitting(false);
    }
  }

  // Calculate stats for a single campaign
  function getCampaignStats(camp: Campaign) {
    const total = camp._count.reviewRequests;
    const completed = camp.reviewRequests.filter((r) => r.status === "COMPLETED").length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, rate };
  }

  if (loading && businesses.length > 0) {
    return <main className="p-12 text-slate-600 font-medium">Loading campaigns...</main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Review Campaigns</h1>
          <p className="mt-1 text-slate-500 text-sm">Create and automate outbound review invitations</p>
        </div>
        <div className="flex items-center gap-3">
          {businesses.length > 1 && (
            <select
              value={selectedBusiness?.id}
              onChange={(e) => {
                const b = businesses.find((x) => x.id === e.target.value);
                if (b) setSelectedBusiness(b);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none"
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 font-sans"
          >
            Create Campaign
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="mt-6 flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <Link href="/dashboard" className="border-b-2 border-transparent pb-2 text-slate-500 hover:text-slate-800">
          Overview
        </Link>
        <Link href="/dashboard/campaigns" className="border-b-2 border-indigo-600 pb-2 text-indigo-600">
          Campaigns
        </Link>
      </nav>

      {businesses.length === 0 ? (
        <section className="mt-12 text-center">
          <p className="text-slate-600">No businesses yet.</p>
        </section>
      ) : (
        <section className="mt-8">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-500">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Campaign Info</th>
                    <th className="px-6 py-4">Channel</th>
                    <th className="px-6 py-4 text-center">Sent Requests</th>
                    <th className="px-6 py-4 text-center">Completed Reviews</th>
                    <th className="px-6 py-4 text-center">Response Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                        No campaigns created yet. Click "Create Campaign" to launch bulk outreach.
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((camp) => {
                      const stats = getCampaignStats(camp);
                      return (
                        <tr key={camp.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">{camp.name}</div>
                            <div className="text-xs text-slate-400">
                              Launched {new Date(camp.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                              {camp.channel}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-slate-800 font-medium">
                            {stats.total}
                          </td>
                          <td className="px-6 py-4 text-center text-slate-800 font-medium">
                            {stats.completed}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-bold text-indigo-600">{stats.rate}%</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* MODAL: Create Campaign */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold text-slate-900">Create Bulk Campaign</h3>
            <form onSubmit={handleCreateCampaign} className="mt-4 flex flex-col gap-4">
              
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. June Newsletter Blast"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="EMAIL">Email</option>
                    <option value="SMS">SMS</option>
                    <option value="WHATSAPP">WhatsApp</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Location</label>
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none"
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Customer List (Format: Name, Email/Phone)
                </label>
                <span className="text-[10px] text-slate-400 block mb-1">
                  Enter one customer per line. Example:<br/>
                  Alice Smith, alice@example.com<br/>
                  Bob Jones, +15555555555
                </span>
                <textarea
                  rows={6}
                  required
                  value={customersText}
                  onChange={(e) => setCustomersText(e.target.value)}
                  placeholder="Alice Smith, alice@example.com&#10;Bob Jones, +15555555555"
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? "Launching..." : "Launch Campaign"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </main>
  );
}
