"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { EmptyState } from "../../../components/ui/EmptyState";

type Location = {
  id: string;
  name: string;
  address: string | null;
  googlePlaceId: string | null;
  _count: { reviewRequests: number };
};

type Business = { id: string; name: string };

export default function LocationsPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [googlePlaceId, setGooglePlaceId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    api.myBusinesses().then(async (businesses: Business[]) => {
      if (!businesses[0]) { setLoading(false); return; }
      setBusiness(businesses[0]);
      const locs = await api.listLocations(businesses[0].id);
      setLocations(locs);
    }).catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!business) return;
    setSaving(true); setError(null);
    try {
      const loc = await api.createLocation(business.id, {
        name,
        address: address || undefined,
        googlePlaceId: googlePlaceId || undefined,
      });
      setLocations((prev) => [loc, ...prev]);
      setName(""); setAddress(""); setGooglePlaceId(""); setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add location.");
    } finally { setSaving(false); }
  }

  async function handleDelete(locationId: string) {
    if (!business || !confirm("Delete this location?")) return;
    await api.deleteLocation(business.id, locationId);
    setLocations((prev) => prev.filter((l) => l.id !== locationId));
  }

  if (loading) return <div className="p-10 text-slate-500">Loading locations…</div>;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Locations</h1>
          <p className="text-sm text-slate-500">Manage your business locations</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
        >
          {showForm ? "Cancel" : "+ Add location"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">New location</h2>
          <div className="flex flex-col gap-3">
            <input
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Location name (e.g. Downtown Branch)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Address (optional)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <input
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Google Place ID (optional, e.g. ChIJ1S-3vGezj4AR0vG20xM204E)"
              value={googlePlaceId}
              onChange={(e) => setGooglePlaceId(e.target.value)}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="self-start rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add location"}
            </button>
          </div>
        </form>
      )}

      {locations.length === 0 ? (
        <EmptyState
          title="No locations yet"
          description="Add your first location to start collecting reviews."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
            >
              Add location
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div>
                <p className="font-medium text-slate-900">{loc.name}</p>
                {loc.address && <p className="text-sm text-slate-500">{loc.address}</p>}
                <p className="text-xs text-slate-400 mt-1">{loc._count?.reviewRequests ?? 0} review requests</p>
              </div>
              <div className="flex items-center gap-3">
                {loc.googlePlaceId ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                    Google connected
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    No Google ID
                  </span>
                )}
                <button
                  onClick={() => handleDelete(loc.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
