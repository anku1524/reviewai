"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEYWORDS_TEXT = "great lattes and friendly staff, wait times are slow on Friday";
const GENERATED_REVIEW = "Outstanding lattes and extremely friendly staff! The cozy tables are perfect for getting work done, although lines do get slightly slow during the Friday afternoon rush. Highly recommend!";

// AI Simulator component
function AIReviewSimulator() {
  const [step, setStep] = useState<"typing" | "generating" | "result">("typing");
  const [typedKeywords, setTypedKeywords] = useState("");
  const [typedReview, setTypedReview] = useState("");

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "typing") {
      if (typedKeywords.length < KEYWORDS_TEXT.length) {
        timer = setTimeout(() => {
          setTypedKeywords(KEYWORDS_TEXT.slice(0, typedKeywords.length + 1));
        }, 50);
      } else {
        timer = setTimeout(() => {
          setStep("generating");
        }, 1500);
      }
    } else if (step === "generating") {
      timer = setTimeout(() => {
        setStep("result");
      }, 1800);
    } else if (step === "result") {
      if (typedReview.length < GENERATED_REVIEW.length) {
        timer = setTimeout(() => {
          setTypedReview(GENERATED_REVIEW.slice(0, typedReview.length + 1));
        }, 25);
      } else {
        timer = setTimeout(() => {
          setTypedKeywords("");
          setTypedReview("");
          setStep("typing");
        }, 6000);
      }
    }

    return () => clearTimeout(timer);
  }, [step, typedKeywords, typedReview]);

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800 text-left shadow-2xl relative overflow-hidden w-full max-w-md mx-auto">
      <div className="absolute -right-16 -top-16 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none" />
      
      <div className="flex items-center gap-1.5 mb-4 border-b border-slate-800/85 pb-3">
        <span className="h-2 w-2 rounded-full bg-rose-500/80" />
        <span className="h-2 w-2 rounded-full bg-amber-500/80" />
        <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
        <span className="text-[10px] text-slate-500 font-mono ml-2">reputation-simulator.ai</span>
      </div>

      <div className="mb-4">
        <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">Customer Keywords</label>
        <div className="bg-slate-950 border border-slate-900 rounded-lg p-3 text-xs text-slate-200 min-h-[50px] font-mono leading-relaxed">
          {typedKeywords}
          {step === "typing" && <span className="w-1.5 h-4 bg-indigo-500 inline-block animate-pulse ml-0.5" />}
        </div>
      </div>

      <div className="mb-4">
        <div className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all duration-300 ${
          step === "typing" ? "bg-indigo-600/90 border-indigo-500 text-white shadow-lg"
          : step === "generating" ? "bg-indigo-950/40 border-indigo-900/50 text-indigo-400"
          : "bg-emerald-950/20 border-emerald-900/50 text-emerald-400"
        }`}>
          {step === "typing" && (
            <>
              <span>✨</span>
              <span>Generate AI Review Draft</span>
            </>
          )}
          {step === "generating" && (
            <>
              <span className="animate-spin text-sm">⏳</span>
              <span>Gemini AI Drafting...</span>
            </>
          )}
          {step === "result" && (
            <>
              <span>✅</span>
              <span>Review Draft Ready</span>
            </>
          )}
        </div>
      </div>

      <div>
        <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">Generated Draft (Customer Approved)</label>
        <div className="bg-indigo-950/10 border border-indigo-900/30 rounded-lg p-3 text-xs text-indigo-200 min-h-[90px] font-mono leading-relaxed relative">
          {step === "result" ? (
            <>
              {typedReview}
              {typedReview.length < GENERATED_REVIEW.length && <span className="w-1.5 h-4 bg-indigo-400 inline-block animate-pulse ml-0.5" />}
            </>
          ) : step === "generating" ? (
            <span className="text-indigo-400/50 italic animate-pulse">Formulating natural review response...</span>
          ) : (
            <span className="text-slate-600 italic font-medium">Waiting for customer input...</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Smartphone SMS mockup component
function SMSSimulator() {
  return (
    <div className="border-[6px] border-slate-800 rounded-[36px] bg-slate-950 p-3 w-72 h-[420px] mx-auto shadow-2xl relative flex flex-col justify-between overflow-hidden">
      {/* Top Camera Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-800 h-4 w-28 rounded-b-xl z-20" />
      
      {/* SMS Header */}
      <div className="border-b border-slate-900 pt-5 pb-2 text-center">
        <p className="text-[10px] font-black text-slate-200">Demo Cafe</p>
        <p className="text-[8px] text-slate-500">Text Message • Today 2:30 PM</p>
      </div>

      {/* SMS Body Bubble */}
      <div className="flex-1 px-2 py-4 flex flex-col justify-start gap-4">
        <div className="bg-slate-900 text-slate-200 text-[10px] rounded-2xl rounded-tl-none p-3 max-w-[85%] self-start border border-slate-800 leading-normal">
          Hi Sarah, thank you for visiting us today! We'd love to hear how your coffee was. Tap below to share feedback:
          <span className="text-indigo-400 block mt-1 underline">reviewme.in/r/downtown-cafe</span>
        </div>
      </div>

      {/* Keyboard simulation input bar */}
      <div className="bg-slate-900/80 rounded-full px-3 py-2 flex items-center justify-between border border-slate-800/60 mb-2">
        <span className="text-[9px] text-slate-500">Text Message...</span>
        <span className="text-indigo-500 text-xs">⬆</span>
      </div>
    </div>
  );
}

// Interactive Review Widget preview
function WebsiteBadgeWidget() {
  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800 max-w-sm mx-auto shadow-xl flex flex-col gap-3 hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Live Website Badge</span>
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
      <div className="flex items-center gap-3">
        <div className="text-3xl font-black text-white">4.9</div>
        <div className="flex flex-col gap-0.5">
          <div className="text-amber-400 text-xs">★★★★★</div>
          <div className="text-[10px] text-slate-400 font-medium">Based on 320 synced reviews</div>
        </div>
      </div>
      <div className="border-t border-slate-800 pt-3 flex gap-3 text-[10px] text-slate-400 justify-start">
        <span className="flex items-center gap-1">🌐 Google GBP</span>
        <span className="flex items-center gap-1">📘 Facebook</span>
      </div>
    </div>
  );
}

// FAQ Accordion Card helper
function FAQCard({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-900 py-4 text-left">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center text-sm font-bold text-white py-1 transition-colors hover:text-indigo-400"
      >
        <span>{question}</span>
        <span className="text-indigo-500 text-lg transition-transform duration-300" style={{ transform: open ? "rotate(45deg)" : "rotate(0)" }}>
          ＋
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? "160px" : "0px", opacity: open ? 1 : 0 }}
      >
        <p className="text-xs text-slate-400 leading-relaxed pt-2 pb-1">
          {answer}
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0B0F19] relative overflow-hidden font-sans">
      
      {/* Background Glow Blobs */}
      <div className="absolute -left-20 top-20 w-80 h-80 bg-blue-600 rounded-full blur-3xl opacity-15 animate-glow-pulse-1 pointer-events-none" />
      <div className="absolute -right-20 top-80 w-96 h-96 bg-purple-600 rounded-full blur-3xl opacity-15 animate-glow-pulse-2 pointer-events-none" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0B0F19]/60 border-b border-slate-900/90 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <span className="text-lg font-black tracking-wider text-white">ReviewAI</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-400">
          <a href="#campaigns" className="hover:text-white transition-colors">Campaigns</a>
          <a href="#inbox" className="hover:text-white transition-colors">Unified Feed</a>
          <a href="#insights" className="hover:text-white transition-colors">AI Insights</a>
          <a href="#widgets" className="hover:text-white transition-colors">Promotion</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white px-3 py-1.5 transition-colors">
            Log In
          </Link>
          <Link href="/register" className="bg-indigo-600 border border-indigo-500 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-xs font-extrabold transition-all shadow-md shadow-indigo-600/10">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        <div className="text-left flex flex-col gap-6">
          <span className="self-start text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-950/50 text-indigo-400 border border-indigo-900/60">
            AI-Powered Reputation Growth
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
            Accelerate your business <span className="text-gradient-accent">reputation growth.</span>
          </h1>
          <p className="text-base text-slate-400 leading-relaxed">
            ReviewAI is a complete reputation intelligence platform. 
            Instantly turn customer keywords into polished review drafts, aggregate multi-location feedback feeds, 
            automate AI replies, and discover operational growth insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link href="/register" className="bg-indigo-600 border border-indigo-500 text-white rounded-xl px-6 py-3 text-sm font-extrabold hover:bg-indigo-500 text-center shadow-lg shadow-indigo-600/20 transition-all">
              Start Free 14-Day Trial
            </Link>
            <Link href="/login" className="glass-card hover:bg-slate-900 text-slate-300 rounded-xl px-6 py-3 text-sm font-semibold border border-slate-800 text-center transition-all">
              Access Live Demo
            </Link>
          </div>
        </div>

        <div className="w-full">
          <AIReviewSimulator />
        </div>
      </section>

      {/* Synced Integrations Showcase Banner */}
      <section className="bg-slate-950/40 border-y border-slate-900/80 py-6 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-around gap-6 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
          <span className="flex items-center gap-1.5 hover:text-slate-400 transition-colors">🌐 Google Business</span>
          <span className="flex items-center gap-1.5 hover:text-slate-400 transition-colors">📘 Facebook Connect</span>
          <span className="flex items-center gap-1.5 hover:text-slate-400 transition-colors">🦉 Yelp Reviews</span>
          <span className="flex items-center gap-1.5 hover:text-slate-400 transition-colors">🧳 TripAdvisor Sync</span>
          <span className="flex items-center gap-1.5 hover:text-slate-400 transition-colors">⭐ Trustpilot Integration</span>
        </div>
      </section>

      {/* Feature 1: Omnichannel Review Campaigns */}
      <section id="campaigns" className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center border-b border-slate-950 relative z-10">
        <div className="w-full lg:order-last text-left flex flex-col gap-5">
          <span className="text-xl">📲</span>
          <h2 className="text-2xl md:text-3xl font-black text-white">Omnichannel Review Request Campaigns</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Reach customers on platforms they check daily. Set up automated, recurring **SMS**, **Email**, and **WhatsApp** campaigns. 
            Create personalized follow-up logic to request reviews after checkout, or print custom branded QR counter plaques to prompt scans inside your store.
          </p>
          <div className="flex flex-col gap-2.5 mt-2">
            <div className="flex items-start gap-3">
              <span className="text-indigo-400 font-bold">✓</span>
              <p className="text-xs text-slate-300"><strong>Auto Reminders</strong>: Automatically prompt follow-ups 3 and 7 days after the first invite.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-indigo-400 font-bold">✓</span>
              <p className="text-xs text-slate-300"><strong>NFC Counter Plaques</strong>: Print or provision physical tap-to-review tags.</p>
            </div>
          </div>
        </div>

        <div className="w-full">
          <SMSSimulator />
        </div>
      </section>

      {/* Feature 2: Unified Reviews Feed & Auto-Replies */}
      <section id="inbox" className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center border-b border-slate-950 relative z-10">
        <div className="text-left flex flex-col gap-5">
          <span className="text-xl">📥</span>
          <h2 className="text-2xl md:text-3xl font-black text-white">The Unified Review Feed</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Monitor, sync, and reply to all local business reviews inside a single command center. 
            Connect Google GBP API, import directories, and leverage **Gemini AI Reply Suggestions** to instantly formulate professional, 
            tone-customized replies to maintain a perfect 100% response rate.
          </p>
          <div className="flex flex-col gap-2.5 mt-2">
            <div className="flex items-start gap-3">
              <span className="text-indigo-400 font-bold">✓</span>
              <p className="text-xs text-slate-300"><strong>One-Click AI Reply</strong>: Draft customized professional, friendly, or short templates in seconds.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-indigo-400 font-bold">✓</span>
              <p className="text-xs text-slate-300"><strong>Platform Direct Posting</strong>: Publish responses instantly to Google Maps via API.</p>
            </div>
          </div>
        </div>

        <div className="w-full">
          {/* Mock review feed UI */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 text-left shadow-xl max-w-md mx-auto">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white">Sarah Jenkins</span>
                <span className="text-[10px] text-slate-500">Google Review • 3 days ago</span>
              </div>
              <span className="text-amber-400 text-xs">★★★★★</span>
            </div>
            <p className="text-xs text-slate-300 italic mb-4">"Outstanding service! Lattes are perfectly balanced. Clean seating and fast Wi-Fi."</p>
            
            <div className="border-t border-slate-900 pt-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[9px] text-slate-400 uppercase font-extrabold tracking-wider">
                <span>AI Suggested Reply Draft</span>
                <span className="text-indigo-400 hover:underline cursor-pointer">Regenerate</span>
              </div>
              <div className="bg-indigo-950/10 border border-indigo-900/30 rounded-lg p-2.5 text-xs text-indigo-300 leading-normal">
                "Thank you so much, Sarah! We're thrilled you enjoyed our lattes and clean work spaces. Looking forward to welcoming you back!"
              </div>
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] self-end mt-1">
                Post Response
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: Sentiment & Operations Insights */}
      <section id="insights" className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center border-b border-slate-950 relative z-10">
        <div className="w-full lg:order-last text-left flex flex-col gap-5">
          <span className="text-xl">🧠</span>
          <h2 className="text-2xl md:text-3xl font-black text-white">Sentiment & Operations Intelligence</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Extract business intelligence directly from what your clients say. 
            ReviewAI consolidates historical trends, aggregates keyword positive/negative sentiments, 
            and maps out critical operational recommendation cards to optimize staff schedules, food quality, or customer wait times.
          </p>
          <div className="bg-slate-950/30 border border-slate-900 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
              <span>💡</span>
              <span>Gemini Operational Advice</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              <strong>Recommendation</strong>: Optimize staffing count on Friday afternoons. Customer comments indicate slow queue processing during rush hours.
            </p>
          </div>
        </div>

        <div className="w-full">
          {/* Sentiment Meter Mock */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 max-w-sm mx-auto shadow-xl flex flex-col gap-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Customer Topic Sentiments</h4>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] text-slate-300 font-medium">
                  <span>Coffee Taste</span>
                  <span className="text-emerald-400 font-bold">95% Positive</span>
                </div>
                <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "95%" }} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] text-slate-300 font-medium">
                  <span>Staff Behavior</span>
                  <span className="text-emerald-400 font-bold">88% Positive</span>
                </div>
                <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "88%" }} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] text-slate-300 font-medium">
                  <span>Wait Times (Friday)</span>
                  <span className="text-rose-400 font-bold">42% Negative</span>
                </div>
                <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: "42%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 4: Website Review Promotion Widgets */}
      <section id="widgets" className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center border-b border-slate-950 relative z-10">
        <div className="text-left flex flex-col gap-5">
          <span className="text-xl">✨</span>
          <h2 className="text-2xl md:text-3xl font-black text-white">Promote Positive Reviews Automatically</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Convert website visitors into paying customers. Showcase your high ratings directly on your website using our 
            embeddable Glassmorphic Badges and Review Carousels. Synchronize new 5-star reviews automatically to build immediate social proof.
          </p>
          <div className="flex flex-col gap-2.5 mt-2">
            <div className="flex items-start gap-3">
              <span className="text-indigo-400 font-bold">✓</span>
              <p className="text-xs text-slate-300"><strong>Flexible Customization</strong>: Style color themes to match your brand identity.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-indigo-400 font-bold">✓</span>
              <p className="text-xs text-slate-300"><strong>Asynchronous Load</strong>: Lightweight script ensuring 0.1s page load speed.</p>
            </div>
          </div>
        </div>

        <div className="w-full">
          <WebsiteBadgeWidget />
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-20 relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-black text-white">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-400 mt-2">Everything you need to know about AI reputation growth</p>
        </div>
        <div className="flex flex-col border-t border-slate-900 mt-6">
          <FAQCard
            question="Is ReviewAI compliant with Google's GBP Policies?"
            answer="Yes. We do not restrict or filter negative feedback automatically (known as review gating). ReviewAI invites all customers to share feedback, helps them draft natural reviews based on keywords they inputs, and allows them to copy & confirm posts manually."
          />
          <FAQCard
            question="Can I manage multiple physical locations?"
            answer="Absolutely. ReviewAI supports multi-location setups natively. You can create separate branches under one business dashboard, assign managers to specific locations, and view comparative analytics breakdowns."
          />
          <FAQCard
            question="How does the AI review generator work?"
            answer="Customers select their star rating and type simple keywords (e.g. 'cozy coffee fresh pastries'). ReviewAI calls our custom Gemini AI service to construct a natural-sounding, descriptive review draft. The customer can adjust the tone or edit the text before posting."
          />
          <FAQCard
            question="How do website badges sync reviews?"
            answer="Once connected, we sync new Google Map reviews to our secure database. Our embeddable web widget dynamically queries these positive reviews and updates your website score immediately."
          />
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="bg-slate-950/40 border-t border-slate-900 py-16 relative z-10 text-center px-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          <h2 className="text-3xl font-black text-white">Ready to automate your reputation growth?</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Join hundreds of local businesses, cafes, clinics, and retail brands leveraging AI to accelerate their local reviews count.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
            <Link href="/register" className="bg-indigo-600 border border-indigo-500 text-white rounded-xl px-6 py-3 text-xs font-bold hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/10">
              Start Your Free Trial
            </Link>
            <Link href="/login" className="glass-card hover:bg-slate-900 text-slate-300 rounded-xl px-6 py-3 text-xs font-semibold border border-slate-800 transition-all">
              Log In to Console
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-950 bg-slate-950/30 py-8 px-6 text-center text-xs text-slate-500 relative z-10">
        <p>© 2026 ReviewAI. Built for AI-First Reputation Growth. All rights reserved.</p>
      </footer>

    </div>
  );
}
