"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";

type Business = { id: string; name: string; category: string };
type Location = { id: string; name: string; address?: string };
type Me = { name: string; email: string; role: string };

type ReviewRequest = {
  id: string;
  channel: string;
  status: string;
  sentAt?: string;
  customer: { name: string; email?: string; phone?: string };
  location: { name: string };
  rating?: { stars: number; feedback?: string; isPrivate: boolean };
};

type Analytics = {
  totalReviews: number;
  pendingRequests: number;
  responseRate: number;
  avgRating: number | null;
  ratingsDistribution: Record<number, number>;
  sentiment: { POSITIVE: number; NEUTRAL: number; NEGATIVE: number };
};

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  // New Request Form states
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [channel, setChannel] = useState("LINK");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // New Location Form states
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [locationGooglePlaceId, setLocationGooglePlaceId] = useState("");
  const [submittingLocation, setSubmittingLocation] = useState(false);

  const [selectedQrLocation, setSelectedQrLocation] = useState<Location | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const isCallback = params.get("google_oauth_callback");
    const locId = params.get("locationId");

    if (isCallback && locId) {
      api.callbackGoogleOauth(locId)
        .then(() => {
          alert("Successfully connected Google Business Profile!");
          router.replace("/dashboard");
        })
        .catch((err) => {
          console.error(err);
          alert("Failed to complete Google OAuth connection.");
          router.replace("/dashboard");
        });
    }
  }, [router]);

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
      api.listReviewRequests(selectedBusiness.id),
      api.analytics(selectedBusiness.id),
    ])
      .then(([locsRes, reqsRes, analyticsRes]) => {
        setLocations(locsRes);
        setRequests(reqsRes);
        setAnalytics(analyticsRes);
        if (locsRes.length > 0) {
          setSelectedLocationId(locsRes[0].id);
        }
      })
      .catch((err) => console.error("Error loading dashboard details:", err))
      .finally(() => setLoading(false));
  }, [selectedBusiness]);

  async function handleCreateReviewRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBusiness || !selectedLocationId) return;

    setSubmittingRequest(true);
    try {
      const res = await api.createReviewRequest(selectedBusiness.id, {
        customerName,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        locationId: selectedLocationId,
        channel,
      });

      // Construct portal URL
      const link = `${window.location.origin}/r/${res.token}`;
      setGeneratedLink(link);
      
      // Refresh requests list
      const updatedReqs = await api.listReviewRequests(selectedBusiness.id);
      setRequests(updatedReqs);

      // Reset fields
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
    } catch (err) {
      console.error(err);
      alert("Failed to create review request.");
    } finally {
      setSubmittingRequest(false);
    }
  }

  async function handleCreateLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBusiness) return;

    setSubmittingLocation(true);
    try {
      const newLoc = await api.createLocation(selectedBusiness.id, {
        name: locationName,
        address: locationAddress || undefined,
        googlePlaceId: locationGooglePlaceId || undefined,
      });

      // Refresh locations list
      const updatedLocs = await api.listLocations(selectedBusiness.id);
      setLocations(updatedLocs);
      setSelectedLocationId(newLoc.id);

      // Reset fields
      setLocationName("");
      setLocationAddress("");
      setLocationGooglePlaceId("");
      setShowLocationForm(false);
    } catch (err) {
      console.error(err);
      alert("Failed to create location.");
    } finally {
      setSubmittingLocation(false);
    }
  }

  if (loading && businesses.length > 0) {
    return <main className="p-12 text-slate-600 font-medium">Loading dashboard...</main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome{me ? `, ${me.name}` : ""}</h1>
          <p className="mt-1 text-slate-500 text-sm">{me?.email} &middot; {me?.role}</p>
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
            onClick={() => setShowRequestForm(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
          >
            Request a Review
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="mt-6 flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <Link href="/dashboard" className="border-b-2 border-indigo-600 pb-2 text-indigo-600">
          Overview
        </Link>
        <Link href="/dashboard/campaigns" className="border-b-2 border-transparent pb-2 text-slate-500 hover:text-slate-800">
          Campaigns
        </Link>
        <Link href="/dashboard/reviews" className="border-b-2 border-transparent pb-2 text-slate-500 hover:text-slate-800">
          Reviews Feed
        </Link>
      </nav>

      {businesses.length === 0 ? (
        <section className="mt-12 text-center">
          <p className="text-slate-600">No businesses yet. Create one to get started.</p>
        </section>
      ) : (
        <>
          {/* Stats Grid */}
          <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Total reviews", value: analytics?.totalReviews ?? 0 },
              { label: "Average rating", value: analytics?.avgRating ? `${analytics.avgRating} ★` : "—" },
              { label: "Pending requests", value: analytics?.pendingRequests ?? 0 },
              { label: "Response rate", value: analytics?.responseRate ? `${analytics.responseRate}%` : "—" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-800">{stat.value}</p>
              </div>
            ))}
          </section>

          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Area: Requests Table */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-slate-800">Recent Review Requests</h2>
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full border-collapse text-left text-sm text-slate-500">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-700">
                    <tr>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Channel</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                          No requests sent yet. Click "Request a Review" to start.
                        </td>
                      </tr>
                    ) : (
                      requests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">{req.customer.name}</div>
                            <div className="text-xs text-slate-500">
                              {req.customer.email ?? req.customer.phone ?? ""}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium uppercase">{req.channel}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                req.status === "COMPLETED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {req.rating ? (
                              <div className="flex flex-col">
                                <span className="font-bold text-amber-500">{req.rating.stars} ★</span>
                                {req.rating.feedback && (
                                  <span className="max-w-xs truncate text-xs text-slate-500">
                                    {req.rating.feedback}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sidebar: Locations & Tools */}
            <div className="flex flex-col gap-6">
              {/* Locations Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800 font-sans">Locations</h3>
                  <button
                    onClick={() => setShowLocationForm(true)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    + Add New
                  </button>
                </div>
                
                {locations.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">No locations added yet.</p>
                ) : (
                  <ul className="mt-4 flex flex-col gap-2">
                    {locations.map((loc) => (
                      <li key={loc.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 hover:bg-slate-100 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{loc.name}</p>
                          {loc.address && <p className="text-xs text-slate-500 mt-0.5">{loc.address}</p>}
                        </div>
                        <button
                          onClick={() => setSelectedQrLocation(loc)}
                          className="rounded bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors"
                        >
                          QR Code
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODAL: Request a Review */}
      {showRequestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold text-slate-900">Request Customer Feedback</h3>
            
            {generatedLink ? (
              <div className="mt-4">
                <p className="text-sm text-slate-600 font-medium">Link generated successfully!</p>
                <div className="mt-2 rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <textarea
                    readOnly
                    rows={3}
                    value={generatedLink}
                    className="w-full bg-transparent text-xs font-mono focus:outline-none"
                  />
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLink);
                      alert("Copied review portal link!");
                    }}
                    className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => {
                      setGeneratedLink(null);
                      setShowRequestForm(false);
                    }}
                    className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateReviewRequest} className="mt-4 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Customer Email (Optional)</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Customer Phone (Optional)</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="+1 555-555-5555"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Location</label>
                  {locations.length === 0 ? (
                    <p className="mt-1 text-xs text-red-500">Please add a location first.</p>
                  ) : (
                    <select
                      value={selectedLocationId}
                      onChange={(e) => setSelectedLocationId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="LINK">Generate Shareable Link</option>
                    <option value="EMAIL">Email Campaign</option>
                    <option value="SMS">SMS Campaign</option>
                  </select>
                </div>

                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestForm(false)}
                    className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest || locations.length === 0}
                    className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {submittingRequest ? "Generating..." : "Generate Request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Add Location */}
      {showLocationForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold text-slate-900">Add Business Location</h3>
            <form onSubmit={handleCreateLocation} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Location Name</label>
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. Downtown Office"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Address (Optional)</label>
                <input
                  type="text"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. 123 Main St, New York"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Google Place ID (Optional)</label>
                <input
                  type="text"
                  value={locationGooglePlaceId}
                  onChange={(e) => setLocationGooglePlaceId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. ChIJ1S-3vGezj4AR0vG20xM204E"
                />
              </div>

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLocationForm(false)}
                  className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLocation}
                  className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submittingLocation ? "Saving..." : "Add Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: QR Code Display */}
      {selectedQrLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-lg text-center animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-900">Location QR Code</h3>
            <p className="text-xs text-slate-500 mt-1">{selectedQrLocation.name}</p>
            
            <div className="mt-6 flex justify-center p-4 border border-slate-100 bg-slate-50 rounded-xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `${window.location.origin}/l/${selectedQrLocation.id}`
                )}`}
                alt="Location Review QR Code"
                className="h-48 w-48 shadow-sm"
              />
            </div>
            
            <p className="mt-4 text-xs text-slate-500">
              Print this QR code. Customers scan this to leave ratings and reviews!
            </p>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  window.open(
                    `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
                      `${window.location.origin}/l/${selectedQrLocation.id}`
                    )}`,
                    "_blank"
                  );
                }}
                className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Open Image
              </button>
              <button
                onClick={() => setSelectedQrLocation(null)}
                className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
