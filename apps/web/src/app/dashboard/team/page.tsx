"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { EmptyState } from "../../../components/ui/EmptyState";

type Member = {
  id: string;
  role: string;
  invitedAt: string;
  user: { id: string; name: string; email: string };
};

type Business = { id: string; name: string };

const ROLES = ["MANAGER", "EMPLOYEE"] as const;

export default function TeamPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"MANAGER" | "EMPLOYEE">("EMPLOYEE");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    api.myBusinesses().then(async (businesses: Business[]) => {
      if (!businesses[0]) { setLoading(false); return; }
      setBusiness(businesses[0]);
      const team = await api.getTeam(businesses[0].id);
      setMembers(team);
    }).catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!business) return;
    setSaving(true); setError(null);
    try {
      const member = await api.inviteMember(business.id, {
        name: inviteName, email: inviteEmail, role: inviteRole,
      });
      setMembers((prev) => [member, ...prev]);
      setInviteName(""); setInviteEmail(""); setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite member.");
    } finally { setSaving(false); }
  }

  async function handleRoleChange(memberId: string, role: string) {
    if (!business) return;
    const updated = await api.updateMemberRole(business.id, memberId, role);
    setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
  }

  async function handleRemove(memberId: string) {
    if (!business || !confirm("Remove this team member?")) return;
    await api.removeMember(business.id, memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  const roleColors: Record<string, string> = {
    MANAGER: "bg-blue-100 text-blue-700",
    EMPLOYEE: "bg-slate-100 text-slate-600",
  };

  if (loading) return <div className="p-10 text-slate-500">Loading team…</div>;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Team</h1>
          <p className="text-sm text-slate-500">Invite and manage your team members</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
        >
          {showForm ? "Cancel" : "+ Invite member"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleInvite} className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Invite team member</h2>
          <div className="flex flex-col gap-3">
            <input
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Full name"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              required
            />
            <input
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Email address"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            <select
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "MANAGER" | "EMPLOYEE")}
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="self-start rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {saving ? "Inviting…" : "Send invite"}
            </button>
          </div>
        </form>
      )}

      {members.length === 0 ? (
        <EmptyState
          title="No team members yet"
          description="Invite managers and employees to help manage your reviews."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
            >
              Invite member
            </button>
          }
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs uppercase text-slate-400">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Invited</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{m.user.name}</td>
                  <td className="px-4 py-3 text-slate-500">{m.user.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium border-0 cursor-pointer ${roleColors[m.role] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(m.invitedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRemove(m.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
