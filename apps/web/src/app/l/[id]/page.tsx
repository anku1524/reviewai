"use client";

import { useEffect, useState, use } from "react";
import { api } from "../../../lib/api";

type PageProps = {
  params: Promise<{ id: string }>;
};

type PublicLocation = {
  id: string;
  name: string;
  business: { name: string; category: string; logoUrl?: string };
};

export default function WalkInReviewPage({ params }: PageProps) {
  const { id } = use(params);
  const [location, setLocation] = useState<PublicLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Flow Step states
  // 1 = Rating Star Picker, 2a = AI Draft Generation, 2b = Private Feedback, 3 = Thank You
  const [step, setStep] = useState<"1" | "2a" | "2b" | "3">("1");

  // Form inputs
  const [stars, setStars] = useState<number>(0);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [feedback, setFeedback] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("professional");
  
  // AI draft & state tracking
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [requestToken, setRequestToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getPublicLocation(id)
      .then((res) => setLocation(res))
      .catch((err) => setError(err.message ?? "Failed to load location details."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleInitialRating(ratingStars: number) {
    setStars(ratingStars);
    if (ratingStars >= 4) {
      setStep("2a");
      await generateGuestDraft(ratingStars, tone, keywords);
    } else {
      setStep("2b");
    }
  }

  async function generateGuestDraft(ratingStars: number, selectedTone: string, keywordsInput: string) {
    setGenerating(true);
    try {
      if (!requestToken) {
        // Initial submission
        const res = await api.submitGuestRating(id, {
          stars: ratingStars,
          feedback: keywordsInput,
          keywords: keywordsInput,
          tone: selectedTone,
          customerName: customerName || undefined,
          customerEmail: customerEmail || undefined,
          customerPhone: customerPhone || undefined,
        });
        setRequestToken(res.token);
        if (res.draft) {
          setAiDraft(res.draft.draft);
        }
      } else {
        // Regeneration using the stashed token
        const res = await api.regenerateDraft(requestToken, {
          keywords: keywordsInput,
          tone: selectedTone,
        });
        setAiDraft(res.draft);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit rating. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmitPrivateFeedback() {
    setGenerating(true);
    try {
      const res = await api.submitGuestRating(id, {
        stars,
        feedback,
        customerName: customerName || undefined,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
      });
      setRequestToken(res.token);
      setStep("3");
    } catch (err) {
      console.error(err);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function handleCopyAndRedirect() {
    if (aiDraft) {
      navigator.clipboard.writeText(aiDraft);
      setCopied(true);
      setStep("3");
      setTimeout(() => {
        const businessName = location?.business.name ?? "";
        const locationName = location?.name ?? "";
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${businessName} ${locationName} review`)}`;
        window.open(searchUrl, "_blank");
      }, 1000);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="text-center text-slate-600 font-medium">Loading walk-in rating portal...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm max-w-md text-center">
          <p className="font-semibold text-red-600">Error</p>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
        </div>
      </main>
    );
  }

  const business = location?.business;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-md">
        
        {/* Brand Header */}
        <header className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-md">
            {business?.name.slice(0, 2).toUpperCase()}
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-800">{business?.name}</h1>
          <p className="text-xs text-slate-500">{location?.name}</p>
        </header>

        {/* Step 1: Star Rating Selector */}
        {step === "1" && (
          <section className="text-center animate-fadeIn">
            <h2 className="text-lg font-semibold text-slate-800">Welcome! How was your visit?</h2>
            
            {/* Optional guest details */}
            <div className="mt-6 flex flex-col gap-3 text-left">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Your Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleInitialRating(star)}
                  onMouseEnter={() => setHoverStars(star)}
                  onMouseLeave={() => setHoverStars(0)}
                  className="text-4xl transition-transform hover:scale-110 focus:outline-none"
                >
                  <span className={(hoverStars || stars) >= star ? "text-amber-400" : "text-slate-200"}>★</span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-500">Tap a star to share your experience</p>
          </section>
        )}

        {/* Step 2a: AI Review Draft generation */}
        {step === "2a" && (
          <section className="animate-fadeIn">
            <h2 className="text-center text-lg font-semibold text-slate-800">Drafting your review...</h2>
            <p className="mt-1 text-center text-xs text-slate-500">
              Personalize your draft below.
            </p>

            {/* Optional keywords */}
            <div className="mt-6">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Key points (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. delicious food, quick service, clean table"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Tone selector */}
            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tone</label>
              <div className="mt-1.5 grid grid-cols-4 gap-1">
                {["professional", "friendly", "concise", "detailed"].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTone(t);
                      generateGuestDraft(stars, t, keywords);
                    }}
                    className={`rounded-md py-1.5 text-xs font-medium capitalize border transition-colors ${
                      tone === t
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Draft textarea */}
            <div className="mt-6">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">AI Review Draft</label>
              <textarea
                rows={4}
                value={aiDraft ?? ""}
                onChange={(e) => setAiDraft(e.target.value)}
                placeholder="Generating draft..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={handleCopyAndRedirect}
                disabled={generating || !aiDraft}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-md transition-all hover:bg-indigo-700 disabled:opacity-50"
              >
                {generating ? "Generating..." : "Copy Review & Go to Google"}
              </button>
              <button
                onClick={() => generateGuestDraft(stars, tone, keywords)}
                disabled={generating}
                className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Regenerate Draft
              </button>
            </div>
          </section>
        )}

        {/* Step 2b: Private Feedback */}
        {step === "2b" && (
          <section className="animate-fadeIn">
            <h2 className="text-lg font-semibold text-slate-800">We're sorry to hear that</h2>
            <p className="mt-1 text-sm text-slate-600">
              Please share your concerns privately so we can address them immediately.
            </p>

            {/* Contact details */}
            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. john@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. +1 555-555-5555"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none"
                />
              </div>
            </div>

            <textarea
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what went wrong..."
              className="mt-4 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none"
              required
            />

            <button
              onClick={handleSubmitPrivateFeedback}
              disabled={generating || !feedback.trim()}
              className="mt-6 w-full rounded-xl bg-slate-900 py-3 font-semibold text-white shadow-md hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {generating ? "Submitting..." : "Submit Private Feedback"}
            </button>
          </section>
        )}

        {/* Step 3: Thank You */}
        {step === "3" && (
          <section className="text-center py-6 animate-fadeIn">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">✓</div>
            <h3 className="mt-4 text-lg font-bold text-slate-800">Thank you!</h3>
            {stars >= 4 ? (
              <p className="mt-2 text-sm text-slate-600">
                Your review has been copied. Redirecting you to Google to paste and publish...
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-600">
                Your feedback has been logged privately. Management values your experience and will review this.
              </p>
            )}
          </section>
        )}

      </div>
    </main>
  );
}
