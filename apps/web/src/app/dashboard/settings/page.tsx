"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

export default function SettingsPage() {
  const [business, setBusiness] = useState<any>(null);
  
  // Branding settings state
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [customDomain, setCustomDomain] = useState("");

  // API key state
  const [keys, setKeys] = useState<any[]>([]);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  // Status/Loading States
  const [loading, setLoading] = useState(true);
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const businesses = await api.myBusinesses();
      if (businesses[0]) {
        const biz = businesses[0];
        setBusiness(biz);
        setLogoUrl(biz.logoUrl || "");
        setPrimaryColor(biz.primaryColor || "#6366f1");
        setCustomDomain(biz.customDomain || "");

        // Load api keys
        const apiKeys = await api.listApiKeys(biz.id);
        setKeys(apiKeys);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveBranding(e: React.FormEvent) {
    e.preventDefault();
    if (!business) return;
    setBrandingLoading(true);
    setMessage(null);
    try {
      const updated = await api.updateBranding(business.id, {
        logoUrl: logoUrl || undefined,
        primaryColor,
        customDomain: customDomain || undefined,
      });
      setBusiness(updated);
      setMessage({ text: "Branding preferences saved successfully!", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to update branding settings.", type: "error" });
    } finally {
      setBrandingLoading(false);
    }
  }

  async function handleGenerateKey(e: React.FormEvent) {
    e.preventDefault();
    if (!business) return;
    setKeyLoading(true);
    setMessage(null);
    setNewlyCreatedKey(null);
    try {
      const result = await api.createApiKey(business.id, newKeyLabel);
      setNewlyCreatedKey(result.key);
      setNewKeyLabel("");
      
      // Reload keys
      const apiKeys = await api.listApiKeys(business.id);
      setKeys(apiKeys);
      setMessage({ text: "API Key generated! Make sure to copy it now.", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to generate API Key.", type: "error" });
    } finally {
      setKeyLoading(false);
    }
  }

  async function handleRevokeKey(keyId: string) {
    if (!business) return;
    if (!confirm("Are you sure you want to revoke this API Key?")) return;
    setMessage(null);
    try {
      await api.revokeApiKey(business.id, keyId);
      // Reload keys
      const apiKeys = await api.listApiKeys(business.id);
      setKeys(apiKeys);
      setMessage({ text: "API Key revoked successfully.", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to revoke key.", type: "error" });
    }
  }

  async function handleUpgrade() {
    if (!business) return;
    setBillingLoading(true);
    setMessage(null);
    try {
      await api.upgradeBilling(business.id);
      // Reload settings to pull updated subscription plan
      await loadSettings();
      setMessage({ text: "Simulated Stripe Upgrade completed! Plan active.", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Upgrade failed.", type: "error" });
    } finally {
      setBillingLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading settings panels...
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        No business registered. Go to the home dashboard to claim a location workspace.
      </div>
    );
  }

  const activePlan = business.subscriptions?.[0]?.plan || "free";
  const activeStatus = business.subscriptions?.[0]?.status || "ACTIVE";

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Configure your white-label customizations, developer API keys, and Stripe billing plans.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm border font-medium ${
          message.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
            : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          {message.text}
        </div>
      )}

      {/* Grid wrapper */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Branding */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Branding & White-Label</h2>
            <p className="text-[11px] text-slate-400 mb-4">Set up color schemes, logos, and custom domains for your clients.</p>
            
            <form onSubmit={handleSaveBranding} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Logo URL</label>
                <input
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Primary Theme Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0 bg-transparent"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                  <input
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors w-full font-mono"
                    placeholder="#6366f1"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Custom Domain</label>
                <input
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="reviews.mybusiness.com"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={brandingLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 text-xs font-bold transition-all mt-2 disabled:opacity-50"
              >
                {brandingLoading ? "Saving Preferences..." : "Save Branding"}
              </button>
            </form>
          </div>
        </div>

        {/* Card 2: Billing & Stripe */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Billing & Subscriptions</h2>
            <p className="text-[11px] text-slate-400 mb-6">Manage monthly subscription tiers and commercial details.</p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-slate-500 font-medium">Subscription Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  activePlan === "pro" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700"
                }`}>
                  {activePlan}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">Payment State</span>
                <span className="text-xs text-slate-700 font-semibold uppercase">{activeStatus}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {activePlan === "free" ? (
                <>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Upgrade to **Pro plan** to unlock branding settings, public API keys, and custom domain mapping.
                  </p>
                  <button
                    onClick={handleUpgrade}
                    disabled={billingLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2.5 text-xs font-bold transition-all disabled:opacity-50 mt-1 shadow-md shadow-indigo-600/10"
                  >
                    {billingLoading ? "Launching Checkout..." : "Upgrade to Pro ($49/mo)"}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-emerald-700 font-medium">
                    ✓ You are on the Pro plan! All custom modules, white-labels, and developer endpoints are unlocked.
                  </p>
                  <button
                    disabled
                    className="w-full bg-slate-100 text-slate-400 border border-slate-200 rounded-lg py-2.5 text-xs font-bold cursor-not-allowed mt-2"
                  >
                    Plan Active
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Panel: API Keys & Integration logs */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-left">
        <h2 className="text-sm font-bold text-slate-900 mb-1">Developer API Keys</h2>
        <p className="text-[11px] text-slate-400 mb-4">Integrate ReviewAI directly with CRM setups like HubSpot or Salesforce via webhooks.</p>

        {newlyCreatedKey && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-5">
            <p className="text-xs text-indigo-800 font-bold mb-1.5">🔑 Copy Your New API Key:</p>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
              This token will only be shown once. Save it securely to prevent unauthorized API requests.
            </p>
            <div className="bg-slate-950 text-indigo-300 font-mono text-xs rounded-lg p-2.5 select-all overflow-x-auto">
              {newlyCreatedKey}
            </div>
          </div>
        )}

        <form onSubmit={handleGenerateKey} className="flex gap-3 mb-6 items-end">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Key Label</label>
            <input
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="e.g., Zapier Integration"
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={keyLoading}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all disabled:opacity-50 h-[32px]"
          >
            {keyLoading ? "Generating..." : "Generate API Key"}
          </button>
        </form>

        {/* List active keys */}
        <div className="flex flex-col border border-slate-100 rounded-xl overflow-hidden mb-6">
          <div className="bg-slate-50 px-4 py-2 flex text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
            <span className="flex-1">Label</span>
            <span className="w-48">Key</span>
            <span className="w-32">Created</span>
            <span className="w-16 text-right">Actions</span>
          </div>

          {keys.length === 0 ? (
            <p className="p-4 text-center text-xs text-slate-400">No active API Keys generated yet.</p>
          ) : (
            keys.map((k) => (
              <div key={k.id} className="px-4 py-3 flex text-xs text-slate-700 items-center border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                <span className="flex-1 font-semibold text-slate-800">{k.label}</span>
                <span className="w-48 font-mono text-[10px] text-slate-500">{k.key}</span>
                <span className="w-32 text-slate-400">{new Date(k.createdAt).toLocaleDateString()}</span>
                <span className="w-16 text-right">
                  <button
                    onClick={() => handleRevokeKey(k.id)}
                    className="text-[10px] font-bold text-rose-600 hover:underline"
                  >
                    Revoke
                  </button>
                </span>
              </div>
            ))
          )}
        </div>

        {/* Code block helper */}
        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-xs font-bold text-slate-800 mb-2">cURL Integration Example</h3>
          <p className="text-[10px] text-slate-500 mb-3">
            Trigger review request campaigns automatically by calling this POST endpoint inside Zapier, make.com, or your custom CRM:
          </p>
          <pre className="bg-slate-950 text-slate-300 font-mono text-[10px] rounded-xl p-4 overflow-x-auto leading-relaxed border border-slate-800">
{`curl -X POST http://localhost:4000/api/public/review-request \\
  -H "X-API-KEY: your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Sarah Jenkins",
    "email": "sarah.j@gmail.com",
    "phone": "555-123-4567",
    "channel": "EMAIL"
  }'`}
          </pre>
        </div>

      </div>

    </div>
  );
}
