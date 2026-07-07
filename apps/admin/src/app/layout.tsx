"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { api } from "../lib/api";
import "./globals.css";

const ADMIN_NAV = [
  { href: "/", label: "Stats Overview", icon: "📊" },
  { href: "/users", label: "User Management", icon: "👥" },
  { href: "/businesses", label: "Business Auditor", icon: "🏢" },
  { href: "/prompt", label: "Prompt Manager", icon: "📝" },
  { href: "/tickets", label: "Global Escalations", icon: "🎫" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminName, setAdminName] = useState("");

  const webAppUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://web-mu-five-68.vercel.app";

  useEffect(() => {
    if (pathname === "/login") return;

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
        localStorage.removeItem("token");
        router.push("/login");
      });
  }, [router, pathname]);

  if (pathname === "/login") {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  if (isAdmin === null) {
    return (
      <html lang="en">
        <body className="flex h-screen w-screen items-center justify-center bg-[#0B0F19] text-slate-400 font-medium">
          Verifying administrative authorization...
        </body>
      </html>
    );
  }

  if (isAdmin === false) {
    return (
      <html lang="en">
        <body className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-[#0B0F19] px-6 text-center">
          <h1 className="text-2xl font-black text-rose-500">Access Denied</h1>
          <p className="text-slate-400 text-sm max-w-md">
            Your account does not possess the SUPER_ADMIN privileges required to access the operations console.
          </p>
          <a
            href={webAppUrl}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 text-xs transition shadow-lg mt-2"
          >
            Return to Application
          </a>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800">
        
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

              <a
                href={webAppUrl}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800/40 hover:text-white transition-all mt-4 border-t border-slate-800/45 pt-4"
              >
                <span className="text-sm">↩️</span>
                <span>Exit to Dashboard</span>
              </a>
            </nav>
          </div>

          {/* User profile foot */}
          <div className="p-4 border-t border-slate-800/60 bg-slate-900/40 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5 text-left">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Logged in as</span>
                <span className="text-xs font-extrabold text-white truncate max-w-[145px]">{adminName}</span>
              </div>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[9px] font-black text-indigo-400 uppercase">
                Admin
              </span>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("admin_token");
                router.push("/login");
              }}
              className="text-left text-[10px] font-bold text-slate-500 hover:text-white transition-colors mt-1"
            >
              Sign out of Ops
            </button>
          </div>

        </aside>

        {/* Main workspace */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>

      </body>
    </html>
  );
}
