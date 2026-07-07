"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

const DEFAULT_PROMPT = `Write a short, professional response from the business owner to the following customer review.
Review Rating: {{stars}}/5 stars.
Review Text: "{{reviewText}}"
Output ONLY the reply text, no greeting placeholders like [Name], and no explanations.`;

export default function AdminPromptPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPrompt();
  }, []);

  async function loadPrompt() {
    setLoading(true);
    try {
      const res = await api.adminGetPrompt();
      setPrompt(res.prompt || DEFAULT_PROMPT);
    } catch (err) {
      console.error("Failed to load prompt configuration:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setSaving(true);
    try {
      await api.adminSavePrompt(prompt);
      alert("AI Review Reply Prompt template updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save prompt configuration.");
    } finally {
      setSaving(false);
    }
  }

  function handleRestoreDefault() {
    if (!confirm("Are you sure you want to restore the default prompt? Any custom edits will be lost.")) return;
    setPrompt(DEFAULT_PROMPT);
  }

  if (loading) {
    return <div className="p-8 text-slate-500 font-medium">Loading Prompt Configuration workspace...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Gemini AI Prompt Manager</h1>
        <p className="text-xs text-slate-500 mt-1">
          Customize the system instructions sent to the Gemini API model for drafting review replies.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        
        {/* Help box */}
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex flex-col gap-1.5 text-xs text-indigo-900">
          <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-500">Variables Guide</span>
          <p className="font-medium">
            You must include the following dynamic placeholder tags inside the template instructions. ReviewAI will replace them at runtime when querying Gemini:
          </p>
          <ul className="list-disc pl-4 flex flex-col gap-1 mt-1 font-mono font-bold text-indigo-700">
            <li>{"{{reviewText}}"} - Inserts the customer's text comment.</li>
            <li>{"{{stars}}"} - Inserts the star rating score (1-5).</li>
          </ul>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">System Prompt Instructions Template</label>
            <textarea
              required
              rows={8}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white p-4 text-xs font-mono focus:border-indigo-500 focus:outline-none"
              placeholder="Enter Gemini instructions..."
            />
          </div>

          <div className="flex gap-3 justify-end mt-2">
            <button
              type="button"
              onClick={handleRestoreDefault}
              className="rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 text-xs font-bold transition"
            >
              Restore Default Template
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 text-xs font-bold transition shadow-md shadow-indigo-600/10"
            >
              {saving ? "Saving Template..." : "Save Prompt Template"}
            </button>
          </div>
        </form>

      </div>

    </div>
  );
}
