"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../../lib/api";

type Me = { name: string; email: string; role: string };
type Business = { id: string; name: string };
type Location = { id: string; name: string };

type PlatformReview = {
  id: string;
  platform: string;
  reviewId: string;
  reviewer: string;
  profilePhotoUrl?: string;
  stars: number;
  comment?: string;
  replyComment?: string;
  replyTime?: string;
  createTime: string;
};

export default function ReviewsPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [reviews, setReviews] = useState<PlatformReview[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [loading, setLoading] = useState(true);

  // Modal / Input states for replying
  const [activeReplyReviewId, setActiveReplyReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [draftingReply, setDraftingReply] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    Promise.all([api.me(), api.myBusinesses()])
      .then(([meRes, businessesRes]) => {
        setMe(meRes);
        setBusinesses(businessesRes);
        if (businessesRes.length > 0) {
          setSelectedBusiness(businessesRes[0]);
        } else {
          setLoading(false);
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    if (!selectedBusiness) return;

    api.listLocations(selectedBusiness.id)
      .then((locsRes) => {
        setLocations(locsRes);
        if (locsRes.length > 0) {
          setSelectedLocationId(locsRes[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error loading locations:", err);
        setLoading(false);
      });
  }, [selectedBusiness]);

  useEffect(() => {
    if (!selectedLocationId) return;
    loadReviews();
  }, [selectedLocationId]);

  function loadReviews() {
    setLoading(true);
    setIsConnected(true);
    api.listPlatformReviews(selectedLocationId)
      .then((reviewsRes) => {
        setReviews(reviewsRes);
      })
      .catch((err) => {
        if (err.message.includes("not connected")) {
          setIsConnected(false);
          setReviews([]);
        } else {
          console.error("Error fetching reviews:", err);
        }
      })
      .finally(() => setLoading(false));
  }

  async function handleConnectGoogle() {
    try {
      const { url } = await api.getGoogleOauthUrl(selectedLocationId);
      window.location.href = `/dashboard?google_oauth_callback=true&locationId=${selectedLocationId}`;
    } catch (err) {
      console.error(err);
      alert("Failed to connect Google account.");
    }
  }

  async function handleSyncReviews() {
    setLoading(true);
    try {
      await api.syncAllPlatformReviews(selectedLocationId);
      loadReviews();
    } catch (err) {
      console.error(err);
      alert("Failed to sync platform reviews.");
      setLoading(false);
    }
  }

  async function handleDraftReply(review: PlatformReview) {
    setActiveReplyReviewId(review.id);
    setReplyText("");
    setDraftingReply(true);
    try {
      const res = await api.draftGoogleReply(review.id);
      setReplyText(res.draft);
    } catch (err) {
      console.error(err);
      alert("Failed to draft AI response. Please enter reply manually.");
    } finally {
      setDraftingReply(false);
    }
  }

  async function handleSubmitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!activeReplyReviewId || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      await api.submitGoogleReply(activeReplyReviewId, replyText);
      
      // Update local review state
      setReviews((prev) =>
        prev.map((r) =>
          r.id === activeReplyReviewId
            ? { ...r, replyComment: replyText, replyTime: new Date().toISOString() }
            : r
        )
      );

      setActiveReplyReviewId(null);
      setReplyText("");
    } catch (err) {
      console.error(err);
      alert("Failed to submit reply.");
    } finally {
      setSubmittingReply(false);
    }
  }

  async function handleSocialShare(review: PlatformReview, platform: string) {
    try {
      await api.socialShareReview(selectedLocationId, review.id, platform);
      alert(`Successfully shared ${review.reviewer}'s review to connected ${platform} page!`);
    } catch (err: any) {
      alert(err.message || "Failed to syndicate review.");
    }
  }

  function renderPlatformBadge(platform: string) {
    switch (platform) {
      case "YELP":
        return <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-[9px] font-extrabold border border-rose-200">Yelp</span>;
      case "FACEBOOK":
        return <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[9px] font-extrabold border border-blue-200">Facebook</span>;
      case "TRIPADVISOR":
        return <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-extrabold border border-emerald-200">TripAdvisor</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[9px] font-extrabold border border-indigo-200">Google GBP</span>;
    }
  }

  if (loading && businesses.length > 0 && reviews.length === 0) {
    return <main className="p-12 text-slate-600 font-medium">Loading synced platform feeds...</main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 text-left">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Unified Reviews Feed</h1>
          <p className="mt-1 text-slate-500 text-sm">Monitor synced reviews across Google, Yelp, and Facebook channels</p>
        </div>
        <div className="flex items-center gap-3">
          {businesses.length > 1 && (
            <select
              value={selectedBusiness?.id}
              onChange={(e) => {
                const b = businesses.find((x) => x.id === e.target.value);
                if (b) setSelectedBusiness(b);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none"
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          {locations.length > 0 && (
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      {/* Tabs */}
      <nav className="mt-6 flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <Link href="/dashboard" className="border-b-2 border-transparent pb-2 text-slate-500 hover:text-slate-800">
          Overview
        </Link>
        <Link href="/dashboard/campaigns" className="border-b-2 border-transparent pb-2 text-slate-500 hover:text-slate-800">
          Campaigns
        </Link>
        <Link href="/dashboard/reviews" className="border-b-2 border-indigo-600 pb-2 text-indigo-600">
          Reviews Feed
        </Link>
      </nav>

      {businesses.length === 0 ? (
        <section className="mt-12 text-center">
          <p className="text-slate-600">No businesses yet.</p>
        </section>
      ) : locations.length === 0 ? (
        <section className="mt-12 text-center">
          <p className="text-slate-600">Create a location on the Overview page to connect integrations.</p>
        </section>
      ) : !isConnected ? (
        <section className="mt-12 text-center rounded-2xl border border-dashed border-slate-300 p-12 bg-white max-w-md mx-auto">
          <div className="text-4xl">🔑</div>
          <h3 className="mt-4 text-lg font-bold text-slate-800">Connect GBP / Platforms</h3>
          <p className="mt-2 text-sm text-slate-500">
            Link this location to fetch real-time public customer reviews and activate AI auto-replies.
          </p>
          <button
            onClick={handleConnectGoogle}
            className="mt-6 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 shadow"
          >
            Connect Account
          </button>
        </section>
      ) : (
        <section className="mt-8 flex flex-col gap-6">
          
          {/* Sync Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {reviews.length} synced reviews
            </span>
            <button
              onClick={handleSyncReviews}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Sync Multi-Platform Reviews
            </button>
          </div>

          {reviews.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              No synced reviews. Click "Sync Multi-Platform Reviews" to load mock feedback feeds.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4">
                  
                  {/* Reviewer Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {rev.profilePhotoUrl ? (
                        <img src={rev.profilePhotoUrl} alt={rev.reviewer} className="h-10 w-10 rounded-full animate-pulse" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
                          {rev.reviewer.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-800">{rev.reviewer}</h4>
                          {renderPlatformBadge(rev.platform)}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Reviewed {new Date(rev.createTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {/* Stars */}
                    <div className="text-amber-500 font-bold">
                      {Array.from({ length: rev.stars }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="text-sm text-slate-600 italic">"{rev.comment}"</p>

                  {/* Owner Response */}
                  {rev.replyComment ? (
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-xs">
                      <div className="flex items-center justify-between text-slate-400 font-semibold uppercase tracking-wider">
                        <span>Your Response</span>
                        <span>{new Date(rev.replyTime!).toLocaleDateString()}</span>
                      </div>
                      <p className="mt-1.5 text-slate-600">{rev.replyComment}</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-2 flex-wrap gap-3">
                      
                      {/* Left: AI reply options */}
                      <div className="flex-1">
                        {activeReplyReviewId === rev.id ? (
                          <form onSubmit={handleSubmitReply} className="flex flex-col gap-3">
                            <textarea
                              rows={3}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              required
                              disabled={draftingReply || submittingReply}
                              placeholder={draftingReply ? "AI is generating reply draft..." : "Write your owner reply..."}
                              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:outline-none focus:border-indigo-500"
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => setActiveReplyReviewId(null)}
                                className="rounded px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={submittingReply || draftingReply || !replyText.trim()}
                                className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                              >
                                {submittingReply ? "Submitting..." : "Post Response"}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDraftReply(rev)}
                              className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors"
                            >
                              Reply with AI
                            </button>
                            <button
                              onClick={() => {
                                setActiveReplyReviewId(rev.id);
                                setReplyText("");
                              }}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              Write Reply
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right: Social Share Actions */}
                      {rev.stars >= 4 && (
                        <div className="flex gap-2 self-end">
                          <button
                            onClick={() => handleSocialShare(rev, "FACEBOOK")}
                            className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all"
                          >
                            Share to FB
                          </button>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              ))}
            </div>
          )}

        </section>
      )}
    </main>
  );
}
