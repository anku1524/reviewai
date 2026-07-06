"use client";

import { useEffect, useState, use } from "react";
import { api } from "../../../lib/api";

type PageProps = {
  params: Promise<{ id: string }>;
};

type ReviewRequest = {
  id: string;
  customer: { name: string; email?: string; phone?: string };
  location: { name: string; business: { name: string; category: string } };
  rating?: {
    stars: number;
    feedback?: string;
    draft?: { draft: string; tone: string };
  };
};

export default function CustomerReviewPage({ params }: PageProps) {
  const { id } = use(params);
  const [requestData, setRequestData] = useState<ReviewRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [stars, setStars] = useState<number>(0);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("professional");
  
  // AI draft states
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getReviewRequest(id)
      .then((res) => {
        setRequestData(res);
        if (res.rating) {
          setStars(res.rating.stars);
          setSubmitted(true);
          if (res.rating.draft) {
            setAiDraft(res.rating.draft.draft);
            setTone(res.rating.draft.tone);
          }
        }
      })
      .catch((err) => {
        setError(err.message ?? "Failed to load review request.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  async function handleInitialRating(ratingStars: number) {
    setStars(ratingStars);
    // If rating is <= 3, we don't automatically generate drafts
    if (ratingStars >= 4) {
      // Trigger auto draft generation with default tone
      await generateDraft(ratingStars, tone, keywords);
    }
  }

  async function generateDraft(ratingStars: number, selectedTone: string, keywordsInput: string) {
    setGenerating(true);
    try {
      // If we haven't submitted the rating yet, we submit it now
      if (!submitted) {
        const res = await api.submitRating(id, {
          stars: ratingStars,
          feedback: keywordsInput,
          keywords: keywordsInput,
          tone: selectedTone,
        });
        setSubmitted(true);
        if (res.draft) {
          setAiDraft(res.draft.draft);
        }
      } else {
        // If already submitted, regenerate the draft
        const res = await api.regenerateDraft(id, {
          keywords: keywordsInput,
          tone: selectedTone,
        });
        setAiDraft(res.draft);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate AI review draft. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmitPrivateFeedback() {
    setGenerating(true);
    try {
      await api.submitRating(id, {
        stars,
        feedback,
      });
      setSubmitted(true);
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
      setTimeout(() => {
        const businessName = requestData?.location.business.name ?? "";
        const locationName = requestData?.location.name ?? "";
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${businessName} ${locationName} review`)}`;
        window.open(searchUrl, "_blank");
      }, 800);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="text-center text-slate-600 font-medium">Loading review portal...</div>
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

  const business = requestData?.location.business;
  const location = requestData?.location;

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

        {/* 1. Star Rating Picker */}
        {stars === 0 && (
          <section className="text-center">
            <h2 className="text-lg font-semibold text-slate-800">How was your experience?</h2>
            <div className="mt-6 flex justify-center gap-2">
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
            <p className="mt-4 text-sm text-slate-500">Tap a star to rate us</p>
          </section>
        )}

        {/* 2. Positive Flow (4-5 Stars) */}
        {stars >= 4 && (
          <section>
            {copied ? (
              <div className="text-center py-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">✓</div>
                <h3 className="mt-4 text-lg font-bold text-slate-800">Review Copied!</h3>
                <p className="mt-2 text-sm text-slate-600">
                  We are redirecting you to Google to paste and submit your review. Thank you for your support!
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-center text-lg font-semibold text-slate-800">Awesome!</h2>
                <p className="mt-1 text-center text-sm text-slate-600">
                  Would you like AI to write a review draft for you?
                </p>

                {/* Optional keywords */}
                <div className="mt-6">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    What stood out? (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. friendly staff, quick appointment, neat office"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Tone picker */}
                <div className="mt-4">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tone</label>
                  <div className="mt-1.5 grid grid-cols-4 gap-1">
                    {["professional", "friendly", "concise", "detailed"].map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setTone(t);
                          generateDraft(stars, t, keywords);
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

                {/* AI generated text output */}
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

                {/* Action Buttons */}
                <div className="mt-6 flex flex-col gap-2">
                  <button
                    onClick={handleCopyAndRedirect}
                    disabled={generating || !aiDraft}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-md transition-all hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {generating ? "Generating..." : "Copy Review & Go to Google"}
                  </button>
                  <button
                    onClick={() => generateDraft(stars, tone, keywords)}
                    disabled={generating}
                    className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Regenerate Draft
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* 3. Private Flow (1-3 Stars) */}
        {stars > 0 && stars <= 3 && (
          <section>
            {submitted ? (
              <div className="text-center py-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-xl text-indigo-600">✓</div>
                <h3 className="mt-4 text-lg font-bold text-slate-800">Thank you</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Your feedback has been sent directly to management. We appreciate you helping us improve our services.
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold text-slate-800">We're sorry to hear that</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Please tell us what went wrong so we can address your concerns.
                </p>

                <textarea
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Your private feedback..."
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
              </div>
            )}
          </section>
        )}

      </div>
    </main>
  );
}
