"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "▦" },
  { href: "/dashboard/locations", label: "Locations", icon: "📍" },
  { href: "/dashboard/reviews", label: "Reviews", icon: "💬" },
  { href: "/dashboard/team", label: "Team", icon: "👥" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "📊" },
  { href: "/dashboard/widgets", label: "Widgets", icon: "✨" },
  { href: "/dashboard/tickets", label: "Tickets", icon: "🎫" },
  { href: "/dashboard/competitors", label: "Competitors", icon: "⚔️" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("");
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    Promise.all([api.me(), api.myBusinesses()]).then(([me, businesses]) => {
      setUserName(me.name);
      if (businesses[0]) setBusinessName(businesses[0].name);
      const adminToken = localStorage.getItem("admin_token");
      if (adminToken) setIsImpersonating(true);
    }).catch(() => router.push("/login"));
  }, [router]);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("admin_token");
    router.push("/login");
  }

  function handleExitImpersonation() {
    const adminToken = localStorage.getItem("admin_token");
    if (adminToken) {
      localStorage.setItem("token", adminToken);
      localStorage.removeItem("admin_token");
      const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002";
      window.location.href = `${adminUrl}/users`;
    }
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      {isImpersonating && (
        <div className="bg-indigo-600 text-white px-6 py-2.5 text-xs font-bold flex justify-between items-center z-50">
          <span>⚠️ Impersonating client account workspace view. Actions performed affect this client.</span>
          <button
            onClick={handleExitImpersonation}
            className="bg-white/20 hover:bg-white/30 text-white rounded px-2.5 py-1 transition font-bold"
          >
            Exit Impersonation
          </button>
        </div>
      )}
      <div className="flex flex-1 min-h-screen">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 bg-slate-900 text-white flex flex-col">
          <div className="px-5 py-5 border-b border-slate-700">
            <p className="text-sm font-bold tracking-wide text-white">ReviewAI</p>
            {businessName && <p className="text-xs text-slate-400 mt-0.5 truncate">{businessName}</p>}
          </div>
          <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
            {NAV.map((item) => {
              const active = item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                    active
                      ? "bg-slate-700 text-white font-medium"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="px-4 py-4 border-t border-slate-700">
            <p className="text-xs text-slate-400 truncate mb-2">{userName}</p>
            <button
              onClick={logout}
              className="text-xs text-slate-500 hover:text-white transition-colors"
            >
              Log out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 bg-slate-50 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
