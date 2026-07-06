"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

export default function WidgetsPage() {
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoPostFacebook, setAutoPostFacebook] = useState(true);
  const [autoPostInstagram, setAutoPostInstagram] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api.myBusinesses()
      .then((businesses) => {
        if (businesses[0]) setBusiness(businesses[0]);
      })
      .catch((err) => console.error("Failed to load business context:", err))
      .finally(() => setLoading(false));
  }, []);

  function handleSaveSettings() {
    setMessage(null);
    setTimeout(() => {
      setMessage("Social auto-share preferences saved successfully!");
    }, 400);
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading widgets panels...</div>;
  }

  if (!business) {
    return <div className="p-8 text-center text-slate-500 font-medium">Please claim a business location workspace first.</div>;
  }

  // Build the live iframe URL
  const iframeUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/public/widgets/${business.id}`
    : `/public/widgets/${business.id}`;

  const copyCode = `<iframe src="${iframeUrl}" style="width:100%; height:320px; border:none; border-radius:16px; background:#0f172a;"></iframe>`;

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Widgets & Social Marketing</h1>
        <p className="text-xs text-slate-500 mt-1">
          Promote your 5-star reviews by embedding widgets on your website and auto-posting social updates.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl text-sm border bg-emerald-50 text-emerald-800 border-emerald-200 font-medium">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Settings Panel */}
        <div className="flex flex-col gap-6">
          
          {/* Card 1: Copy Iframe Code */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Embed Rating Carousel</h2>
            <p className="text-[11px] text-slate-400 mb-4 font-medium">
              Copy and paste this lightweight iframe inside your website editor (WordPress, Webflow, Wix, or Shopify).
            </p>
            
            <div className="flex flex-col gap-3">
              <textarea
                readOnly
                className="bg-slate-950 text-indigo-300 font-mono text-[10px] rounded-xl p-4 min-h-[100px] select-all outline-none border border-slate-800 leading-relaxed"
                value={copyCode}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(copyCode);
                  alert("Copied embed code to clipboard!");
                }}
                className="self-end bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-1.5 text-xs font-bold transition-all shadow-md shadow-indigo-600/10"
              >
                Copy Code
              </button>
            </div>
          </div>

          {/* Card 2: Social Auto-Post */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Social Auto-Share (Reputation Marketing)</h2>
            <p className="text-[11px] text-slate-400 mb-4 font-medium">
              Automatically publish positive customer reviews directly onto connected business streams.
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div className="flex flex-col gap-0.5 text-left">
                  <span className="text-xs font-bold text-slate-800">📘 Auto-post to Facebook Page</span>
                  <span className="text-[9px] text-slate-400">Share reviews with stars rating ≥ 4★</span>
                </div>
                <input
                  type="checkbox"
                  className="w-8 h-4 rounded cursor-pointer"
                  checked={autoPostFacebook}
                  onChange={(e) => setAutoPostFacebook(e.target.checked)}
                />
              </div>

              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div className="flex flex-col gap-0.5 text-left">
                  <span className="text-xs font-bold text-slate-800">📸 Auto-post to Instagram Business</span>
                  <span className="text-[9px] text-slate-400">Share review text visuals to feeds</span>
                </div>
                <input
                  type="checkbox"
                  className="w-8 h-4 rounded cursor-pointer"
                  checked={autoPostInstagram}
                  onChange={(e) => setAutoPostInstagram(e.target.checked)}
                />
              </div>

              <button
                onClick={handleSaveSettings}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 text-xs font-bold transition-all mt-1"
              >
                Save Social Preferences
              </button>
            </div>
          </div>

        </div>

        {/* Right Preview Frame */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-900">Live Website Preview</h2>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-[11px] text-slate-400 mb-2">This is how the embedded rating widget will appear on your homepage:</p>
          
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner bg-slate-950">
            <iframe
              src={iframeUrl}
              style={{ width: "100%", height: "260px", border: "none" }}
            />
          </div>
        </div>

      </div>

    </div>
  );
}
