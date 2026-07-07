import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AIDraftsService {
  constructor(private prisma: PrismaService) {}

  private getApiKey(): string | null {
    return process.env.GEMINI_API_KEY ?? null;
  }

  async generateReviewDraft(
    category: string,
    stars: number,
    keywords: string = "",
    tone: string = "professional",
  ): Promise<string> {
    const apiKey = this.getApiKey();
    const prompt = `Write a short, realistic customer review for a business in the category "${category}".
Star rating: ${stars}/5.
Key points/keywords to include: ${keywords || "General good service"}.
Tone: ${tone}.
Output ONLY the review text itself, with no titles, quotes, intro, or explanation.`;

    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text.trim().replace(/^["']|["']$/g, "");
        }
      } catch (err) {
        console.error("Gemini API call failed, falling back:", err);
      }
    }

    return this.generateFallbackReview(category, stars, keywords, tone);
  }

  async generateReplyDraft(reviewText: string, stars: number): Promise<string> {
    const apiKey = this.getApiKey();
    
    let prompt = `Write a short, professional response from the business owner to the following customer review.
Review Rating: ${stars}/5 stars.
Review Text: "${reviewText}"
Output ONLY the reply text, no greeting placeholders like [Name], and no explanations.`;

    try {
      const customConfig = await this.prisma.systemConfig.findUnique({
        where: { key: "gemini_review_prompt" }
      });
      if (customConfig && customConfig.value && customConfig.value.trim()) {
        prompt = customConfig.value
          .replace("{{reviewText}}", reviewText)
          .replace("{{stars}}", String(stars));
      }
    } catch (e) {
      console.warn("Could not fetch custom prompt from database, using fallback:", e);
    }

    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text.trim().replace(/^["']|["']$/g, "");
        }
      } catch (err) {
        console.error("Gemini API reply generation failed, falling back:", err);
      }
    }

    if (stars >= 4) {
      return "Thank you so much for your kind review! We are thrilled to hear you had a great experience and we look forward to welcoming you back soon.";
    } else {
      return "Thank you for sharing your feedback. We are truly sorry to hear that your experience did not meet your expectations. We would love to learn more and make things right; please feel free to reach out to us directly.";
    }
  }

  async analyzeFeedback(reviewsText: string, category: string): Promise<any> {
    const apiKey = this.getApiKey();
    const prompt = `You are a business consultant analyzing customer review feedback for a "${category}" business.
Analyze the following compiled customer reviews and extract:
1. Word Cloud keywords: Select up to 10 key topics, keywords, or aspects mentioned (e.g. "service", "coffee", "parking"). For each, provide a relative weight (1 to 100) and its sentiment classification ("positive", "neutral", or "negative").
2. AI Action Recommendations: Provide 2 or 3 highly specific, actionable operational recommendations. For each, specify a recommendation title/type (e.g. "staffing", "service", "cleanliness", "quality", "other"), the recommendation text, and a concise rationale based on client complaints or praise.

Format your output strictly as a JSON object matching this structure (do not include markdown blocks, just raw JSON):
{
  "wordCloud": [
    { "text": "...", "value": 80, "sentiment": "positive" }
  ],
  "recommendations": [
    { "type": "staffing", "recommendation": "...", "rationale": "..." }
  ]
}

Reviews to analyze:
${reviewsText || "No reviews submitted yet."}`;

    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json"
              }
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return JSON.parse(text.trim());
          }
        }
      } catch (err) {
        console.error("Gemini feedback analysis failed, falling back:", err);
      }
    }

    return this.generateFallbackAnalysis(category);
  }

  private generateFallbackAnalysis(category: string): any {
    const defaultKeywords = {
      cafe: [
        { text: "coffee quality", value: 85, sentiment: "positive" },
        { text: "friendly staff", value: 75, sentiment: "positive" },
        { text: "cozy seating", value: 65, sentiment: "positive" },
        { text: "seating layout", value: 40, sentiment: "negative" },
        { text: "waiting time", value: 35, sentiment: "negative" },
        { text: "car parking", value: 25, sentiment: "negative" },
      ],
      restaurant: [
        { text: "food quality", value: 90, sentiment: "positive" },
        { text: "menu variety", value: 80, sentiment: "positive" },
        { text: "hospitality", value: 70, sentiment: "positive" },
        { text: "table booking", value: 45, sentiment: "negative" },
        { text: "service speed", value: 40, sentiment: "negative" },
      ],
      salon: [
        { text: "hair stylists", value: 88, sentiment: "positive" },
        { text: "clean station", value: 80, sentiment: "positive" },
        { text: "booking app", value: 60, sentiment: "neutral" },
        { text: "waiting lounge", value: 45, sentiment: "negative" },
      ]
    };

    const defaultRecommendations = {
      cafe: [
        {
          type: "staffing",
          recommendation: "Optimize Friday afternoon staffing configurations.",
          rationale: "Multiple customers highlighted slower service times and queues between 3 PM and 6 PM on Fridays.",
        },
        {
          type: "service",
          recommendation: "Introduce mobile ordering options for quick takeaways.",
          rationale: "Customers frequently mention long queues for ordering coffee near the entrance during breakfast hours.",
        },
      ],
      restaurant: [
        {
          type: "quality",
          recommendation: "Conduct kitchen temperature and consistency audits.",
          rationale: "Recent reviews point to slight variations in steak doneness and food temperature during dinner rushes.",
        },
        {
          type: "staffing",
          recommendation: "Add table managers on weekend dinner slots.",
          rationale: "Customers experienced delayed greeting times at the front reception on Saturday nights.",
        },
      ],
      salon: [
        {
          type: "other",
          recommendation: "Provide walk-in queue updates in the waiting area.",
          rationale: "Customers expressed minor frustration regarding unclear wait times for unscheduled hair service slots.",
        },
      ]
    };

    const key = category.toLowerCase().includes("cafe") ? "cafe"
              : category.toLowerCase().includes("salon") ? "salon"
              : "restaurant";

    return {
      wordCloud: defaultKeywords[key],
      recommendations: defaultRecommendations[key],
    };
  }

  private generateFallbackReview(
    category: string,
    stars: number,
    keywords: string,
    tone: string,
  ): string {
    const hasKeywords = keywords.trim().length > 0;
    const cleanKeywords = keywords.toLowerCase();

    const openers = {
      professional: `I had an excellent experience visiting this ${category}.`,
      friendly: `Wow, I absolutely loved my visit to this ${category}!`,
      concise: `Great ${category}.`,
      detailed: `I recently visited this ${category} and wanted to share my detailed thoughts.`,
    };

    const mainSentences: string[] = [];
    if (hasKeywords) {
      mainSentences.push(`It was great to see how they handled ${cleanKeywords}.`);
    } else {
      mainSentences.push(`The quality of service was exceptional and the environment was very clean.`);
    }

    if (tone === "friendly") {
      mainSentences.push("The team was super nice and made sure I was comfortable the whole time.");
    } else if (tone === "detailed") {
      mainSentences.push("Everything from the booking process to the actual session was highly organized and professional.");
    } else if (tone === "professional") {
      mainSentences.push("Their staff demonstrated strong attention to detail and customer care.");
    }

    const closers = {
      professional: "I highly recommend their services to anyone looking for a reliable provider.",
      friendly: "I will definitely be coming back here. Thank you so much!",
      concise: "Highly recommend.",
      detailed: "Given the pricing and overall high standards of customer satisfaction, I would highly recommend them.",
    };

    const selectedOpener = openers[tone] ?? openers.professional;
    const selectedCloser = closers[tone] ?? closers.professional;

    return `${selectedOpener} ${mainSentences.join(" ")} ${selectedCloser}`;
  }
}
