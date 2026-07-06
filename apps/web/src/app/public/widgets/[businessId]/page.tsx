"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "../../../../lib/api";

export default function PublicWidgetPage() {
  const { businessId } = useParams();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (businessId) {
      api.getPublicWidgetData(businessId as string)
        .then((res) => setData(res))
        .catch((err) => setError(err.message || "Failed to load reviews data."))
        .finally(() => setLoading(false));
    }
  }, [businessId]);

  // Automatic carousel transition
  useEffect(() => {
    if (!data?.testimonials || data.testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % data.testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-xs font-mono">
        Loading review widget...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-rose-400 flex items-center justify-center text-xs font-mono p-6 text-center">
        {error || "Widget data unavailable."}
      </div>
    );
  }

  const primaryCol = data.primaryColor || "#6366f1";
  const testimonials = data.testimonials || [];
  const activeTestimonial = testimonials[activeIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      
      {/* Widget Container */}
      <div className="w-full max-w-lg bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden shadow-2xl">
        {/* Accent branding shine */}
        <div 
          className="absolute -right-20 -top-20 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none" 
          style={{ backgroundColor: primaryCol }}
        />

        {/* Top Header Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 mb-4 gap-4">
          <div className="flex items-center gap-3">
            {data.logoUrl ? (
              <img src={data.logoUrl} alt="Logo" className="w-10 h-10 rounded-full border border-slate-800 object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-sm uppercase">
                {data.businessName.slice(0, 2)}
              </div>
            )}
            <div className="text-left">
              <h1 className="text-sm font-bold text-slate-100">{data.businessName}</h1>
              <p className="text-[10px] text-slate-400">Verified Reputation Feed</p>
            </div>
          </div>

          {/* Aggregate metrics */}
          <div className="flex items-center gap-3 text-left">
            <span className="text-2xl font-black" style={{ color: primaryCol }}>{data.averageRating}</span>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-amber-400">★★★★★</span>
              <span className="text-[9px] text-slate-400 font-medium">Based on {data.totalReviews} reviews</span>
            </div>
          </div>
        </div>

        {/* Testimonial slider */}
        {testimonials.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500 italic">No reviews shared publicly yet.</p>
        ) : (
          <div className="min-h-[100px] flex flex-col justify-between py-2 text-left relative">
            <p className="text-xs text-slate-200 italic leading-relaxed mb-6 font-medium">
              "{activeTestimonial.comment}"
            </p>
            
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-200">{activeTestimonial.reviewer}</span>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                  via {activeTestimonial.platform}
                </span>
              </div>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                  className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-[10px] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  ◀
                </button>
                <button 
                  onClick={() => setActiveIndex((prev) => (prev + 1) % testimonials.length)}
                  className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-[10px] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  ▶
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
