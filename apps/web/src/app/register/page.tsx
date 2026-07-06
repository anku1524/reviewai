"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { accessToken } = await api.register({ name, email, password });
      localStorage.setItem("token", accessToken);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] relative overflow-hidden flex items-center justify-center px-6 py-24 font-sans">
      
      {/* Background glow spots */}
      <div className="absolute -left-20 top-20 w-80 h-80 bg-blue-600 rounded-full blur-3xl opacity-15 pointer-events-none animate-glow-pulse-1" />
      <div className="absolute -right-20 bottom-20 w-80 h-80 bg-purple-600 rounded-full blur-3xl opacity-15 pointer-events-none animate-glow-pulse-2" />

      {/* Main glassmorphism card */}
      <main className="w-full max-w-sm glass-card border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
        
        {/* Brand logo */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <Link href="/" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
            <span className="text-xl">✨</span>
            <span className="text-sm font-black tracking-wider uppercase">ReviewAI</span>
          </Link>
          <h1 className="text-xl font-extrabold text-white mt-4">Create Account</h1>
          <p className="text-xs text-slate-400">Claim your free trial and unlock AI-powered growth</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
            <input
              className="rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 px-3 py-2 text-sm text-slate-200 outline-none transition-all"
              placeholder="Demo Owner"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
            <input
              className="rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 px-3 py-2 text-sm text-slate-200 outline-none transition-all"
              placeholder="name@business.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</label>
            <input
              className="rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 px-3 py-2 text-sm text-slate-200 outline-none transition-all"
              placeholder="••••••••"
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-xs text-rose-400 text-left bg-rose-950/20 border border-rose-900/30 rounded-lg p-2.5 mt-1">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 border border-indigo-500 hover:bg-indigo-500 text-white py-2 text-xs font-bold transition-all shadow-md shadow-indigo-600/10 disabled:opacity-50 mt-2"
          >
            {loading ? "Claiming Trial Workspace..." : "Get Started Free"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
          <p className="text-xs text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Log In
            </Link>
          </p>
        </div>

      </main>

    </div>
  );
}
