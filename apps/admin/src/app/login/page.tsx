"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Authenticate credentials
      const { accessToken } = await api.login({ email, password });
      
      // Temporary token storage to check roles
      localStorage.setItem("token", accessToken);

      // 2. Verify account role level
      const user = await api.me();
      if (user.role !== "SUPER_ADMIN") {
        localStorage.removeItem("token");
        throw new Error("Access Denied: Standard business profiles are not authorized to enter the operations workspace.");
      }

      // 3. Authorized login
      alert(`Welcome back, ${user.name}!`);
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to authenticate credentials.");
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0B0F19] text-left px-4">
      <div className="w-full max-w-sm bg-[#111827] border border-slate-800 rounded-3xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <span className="text-3xl">🛠️</span>
          <h1 className="text-xl font-extrabold text-white mt-3">ReviewAI Ops Login</h1>
          <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">
            Super Admin Console Access
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs bg-rose-950/40 text-rose-400 border border-rose-900 rounded-xl mb-5 font-medium leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Operator Email Address
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@reviewai.dev"
              className="rounded-xl border border-slate-800 bg-[#0B0F19] px-4 py-2.5 text-xs font-semibold text-white placeholder-slate-650 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Password Credentials
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="rounded-xl border border-slate-800 bg-[#0B0F19] px-4 py-2.5 text-xs font-semibold text-white placeholder-slate-650 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 mt-4 transition shadow-lg shadow-indigo-600/10"
          >
            {loading ? "Authenticating Operator..." : "Authenticate Session"}
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-slate-800/60">
          <a
            href={process.env.NEXT_PUBLIC_WEB_URL || "https://web-mu-five-68.vercel.app"}
            className="text-[10px] font-bold text-slate-500 hover:text-indigo-400 uppercase tracking-wider transition-colors"
          >
            ↩️ Return to Business Portal
          </a>
        </div>
      </div>
    </div>
  );
}
