"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";

const ADMIN_NAV = [
  { href: "/admin", label: "Stats Overview", icon: "📊" },
  { href: "/admin/users", label: "User Management", icon: "👥" },
  { href: "/admin/businesses", label: "Business Auditor", icon: "🏢" },
  { href: "/admin/prompt", label: "Prompt Manager", icon: "📝" },
  { href: "/admin/tickets", label: "Global Escalations", icon: "🎫" },
  { href: "/dashboard", label: "Exit to Dashboard", icon: "↩️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    api.me()
      .then((user) => {
        if (user.role !== "SUPER_ADMIN") {
          setIsAdmin(false);
        } else {
          setIsAdmin(true);
          setAdminName(user.name);
        }
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  if (isAdmin === null) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0B0F19] text-slate-400 font-medium">
        Verifying administrative authorization...
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-[#0B0F19] px-6 text-center">
        <h1 className="text-2xl font-black text-rose-500">Access Denied</h1>
        <p className="text-slate-400 text-sm max-w-md">
          Your account does not possess the SUPER_ADMIN privileges required to access the operations console.
        </p>
        <Link
          href="/dashboard"
          className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 text-xs transition shadow-lg mt-2"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800">
      
      {/* Sidebar navigation */}
      <aside className="w-64 bg-[#0D1220] text-slate-300 flex flex-col justify-between border-r border-slate-800">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-slate-800/60 flex items-center gap-2">
            <span className="text-xl">🛠️</span>
            <div>
              <h2 className="font-extrabold text-sm text-white tracking-wider uppercase">ReviewAI Ops</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Super Admin Portal</p>
            </div>
          </div>

          {/* Links list */}
          <nav className="p-4 flex flex-col gap-1.5">
            {ADMIN_NAV.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
                  }`}
                >
                  <span className="text-sm">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile foot */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-900/40 flex items-center justify-between">
          <div className="flex flex-col gap-0.5 text-left">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Logged in as</span>
            <span className="text-xs font-extrabold text-white truncate max-w-[140px]">{adminName}</span>
          </div>
          <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[9px] font-black text-indigo-400 uppercase">
            Admin
          </span>
        </div>

      </aside>

      {/* Main workspace */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        {children}
      </main>

    </div>
  );
}
