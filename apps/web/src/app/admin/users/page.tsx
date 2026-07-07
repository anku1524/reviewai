"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  suspended: boolean;
  createdAt: string;
  ownedBusinesses: Array<{ id: string; name: string }>;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const list = await api.adminListUsers();
      setUsers(list);
    } catch (err) {
      console.error("Failed to load user accounts list:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, currentRole: string) {
    const newRole = currentRole === "SUPER_ADMIN" ? "BUSINESS_OWNER" : "SUPER_ADMIN";
    if (!confirm(`Are you sure you want to change user role to ${newRole}?`)) return;

    try {
      await api.adminUpdateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to modify user authorization level.");
    }
  }

  async function handleToggleSuspension(userId: string, currentStatus: boolean) {
    const nextStatus = !currentStatus;
    const actionText = nextStatus ? "suspend and revoke access for" : "restore access for";
    if (!confirm(`Are you sure you want to ${actionText} this user?`)) return;

    try {
      await api.adminToggleUserStatus(userId, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, suspended: nextStatus } : u))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to modify user suspension status.");
    }
  }

  async function handleImpersonate(userId: string) {
    try {
      const res = await api.adminImpersonateUser(userId);
      const currentToken = localStorage.getItem("token");
      if (currentToken) {
        localStorage.setItem("admin_token", currentToken);
      }
      localStorage.setItem("token", res.accessToken);
      alert("Impersonating user... Redirecting to overview.");
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      alert("Failed to impersonate user.");
    }
  }

  if (loading) {
    return <div className="p-8 text-slate-500 font-medium">Loading user management console...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">User Account Management</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage user profiles, assign administrative roles, or suspend account access credentials instantly.
        </p>
      </div>

      {/* Users Accounts Table Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-500 border-collapse">
            <thead>
              <tr className="border-b border-slate-100 uppercase text-[10px] font-bold text-slate-400">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role / Level</th>
                <th className="py-3 px-4">Businesses</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-800">{user.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{user.email}</span>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <span
                      onClick={() => handleRoleChange(user.id, user.role)}
                      className={`cursor-pointer rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase transition ${
                        user.role === "SUPER_ADMIN"
                          ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                      title="Click to toggle role level"
                    >
                      {user.role}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {user.ownedBusinesses.map((b) => (
                        <span key={b.id} className="rounded bg-slate-50 border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                          {b.name}
                        </span>
                      ))}
                      {user.ownedBusinesses.length === 0 && (
                        <span className="text-[10px] text-slate-400 italic">None</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-slate-400 font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-4">
                    {user.suspended ? (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-black text-rose-700 uppercase">
                        Suspended
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700 uppercase">
                        Active
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right flex justify-end gap-2 items-center">
                    <button
                      onClick={() => handleImpersonate(user.id)}
                      className="text-[10px] font-bold transition-all px-2.5 py-1 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                    >
                      Login As
                    </button>
                    <button
                      onClick={() => handleToggleSuspension(user.id, user.suspended)}
                      className={`text-[10px] font-bold transition-all px-3 py-1 rounded-md border ${
                        user.suspended
                          ? "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                      }`}
                    >
                      {user.suspended ? "Reactivate" : "Suspend"}
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
