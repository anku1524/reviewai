"use client";

import { useEffect, useState, use } from "react";
import { api } from "../../../lib/api";

type PageProps = {
  params: Promise<{ token: string }>;
};

type ReviewRequest = {
  id: string;
  token: string;
  customer: { name: string; email?: string; phone?: string };
  location: { name: string; business: { name: string; category: string } };
  rating?: {
    stars: number;
    feedback?: string;
    draft?: { draft: string; tone: string };
  };
};

export default function CustomerReviewPage({ params }: PageProps) {
  const { token } = use(params);
  const [requestData, setRequestData] = useState<ReviewRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Flow Step states
  // 1 = Rating Star Selector, 2a = AI Draft Generation, 2b = Private Feedback, 3 = Thank You
  const [step, setStep] = useState<"1" | "2a" | "2b" | "3">("1");

  // Form inputs
  const [stars, setStars] = useState<number>(0);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("professional");
  
  // AI draft states
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.getReviewRequest(token)
      .then((res) => {
        setRequestData(res);
        if (res.rating) {
          setStars(res.rating.stars);
          setSubmitted(true);
          if (res.rating.isPrivate) {
            setStep("3");
          } else {
            if (res.rating.draft) {
              setAiDraft(res.rating.draft.draft);
              setTone(res.rating.draft.tone);
            }
            setStep("2a");
          }
        }
      })
      .catch((err) => {
        setError(err.message ?? "Failed to load review request.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  async function handleInitialRating(ratingStars: number) {
    setStars(ratingStars);
    if (ratingStars >= 4) {
      setStep("2a");
      await generateDraft(ratingStars, tone, keywords);
    } else {
      setStep("2b");
    }
  }

  async function generateDraft(ratingStars: number, selectedTone: string, keywordsInput: string) {
    setGenerating(true);
    try {
      if (!submitted) {
        const res = await api.submitRating(token, {
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
        const res = await api.regenerateDraft(token, {
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
      await api.submitRating(token, {
        stars,
        feedback,
      });
      setSubmitted(true);
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
      setStep("3");
      setTimeout(() => {
        const businessName = requestData?.location.business.name ?? "";
        const locationName = requestData?.location.name ?? "";
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${businessName} ${locationName} review`)}`;
        window.open(searchUrl, "_blank");
      }, 1000);
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
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-md transition-all">
        
        {/* Brand Header */}
        <header className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-md">
            {business?.name.slice(0, 2).toUpperCase()}
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-800">{business?.name}</h1>
          <p className="text-xs text-slate-500">{location?.name}</p>
        </header>

        {/* Step 1: Star Rating Landing Page */}
        {step === "1" && (
          <section className="text-center animate-fadeIn">
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
            <p className="mt-4 text-sm text-slate-500">Tap a star to rate your visit</p>
          </section>
        )}

        {/* Step 2a: AI Draft Page */}
        {step === "2a" && (
          <section className="animate-fadeIn">
            <h2 className="text-center text-lg font-semibold text-slate-800 font-sans">Drafting your review...</h2>
            <p className="mt-1 text-center text-xs text-slate-500">
              Personalize your draft using keywords and tone selection below.
            </p>

            {/* Optional keywords */}
            <div className="mt-6">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Key points (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. welcoming atmosphere, quick appointment"
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

            {/* Text draft output */}
            <div className="mt-6">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">AI Review Draft</label>
              <textarea
                rows={4}
                value={aiDraft ?? ""}
                onChange={(e) => setAiDraft(e.target.value)}
                placeholder="Generating review..."
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
                onClick={() => generateDraft(stars, tone, keywords)}
                disabled={generating}
                className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Regenerate Draft
              </button>
            </div>
          </section>
        )}

        {/* Step 2b: Private Feedback Page */}
        {step === "2b" && (
          <section className="animate-fadeIn">
            <h2 className="text-lg font-semibold text-slate-800">We're sorry to hear that</h2>
            <p className="mt-1 text-sm text-slate-600">
              Please tell us what went wrong so we can make this right.
            </p>

            <textarea
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Your private feedback (sent directly to management)..."
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

        {/* Step 3: Thank You Page */}
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
                Your private feedback has been received. We value your input and will reach out if needed.
              </p>
            )}
          </section>
        )}

      </div>
    </main>
  );
}
