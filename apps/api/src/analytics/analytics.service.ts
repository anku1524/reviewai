import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AIDraftsService } from "../ai-drafts/ai-drafts.service";

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private aiDrafts: AIDraftsService,
  ) {}

  private async assertOwner(businessId: string, userId: string) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException("Business not found.");
    if (business.ownerId !== userId) throw new ForbiddenException("Access denied.");
    return business;
  }

  async getOverview(businessId: string, userId: string) {
    await this.assertOwner(businessId, userId);

    const locationIds = await this.prisma.location
      .findMany({ where: { businessId }, select: { id: true } })
      .then((locs) => locs.map((l) => l.id));

    // Total reviews submitted (clicked or completed)
    const totalReviews = await this.prisma.reviewRequest.count({
      where: { locationId: { in: locationIds }, status: { in: ["CLICKED", "COMPLETED"] } },
    });

    // Pending requests
    const pendingRequests = await this.prisma.reviewRequest.count({
      where: { locationId: { in: locationIds }, status: { in: ["PENDING", "SENT", "OPENED"] } },
    });

    // Total requests sent (for response rate calculation)
    const totalSent = await this.prisma.reviewRequest.count({
      where: { locationId: { in: locationIds }, status: { not: "PENDING" } },
    });

    const responseRate = totalSent > 0 ? Math.round((totalReviews / totalSent) * 100) : 0;

    // Average star rating from all ratings tied to these locations
    const ratings = await this.prisma.rating.findMany({
      where: { reviewRequest: { locationId: { in: locationIds } }, isPrivate: false },
      select: { stars: true },
    });
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((acc, r) => acc + r.stars, 0) / ratings.length) * 10) / 10
        : null;

    // Review growth: last 6 months, one data point per month
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const recentRatings = await this.prisma.rating.findMany({
      where: {
        reviewRequest: { locationId: { in: locationIds } },
        isPrivate: false,
        createdAt: { gte: sixMonthsAgo },
      },
      select: { stars: true, createdAt: true },
    });

    const growthByMonth: Record<string, { count: number; totalStars: number }> = {};
    recentRatings.forEach((r) => {
      const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (!growthByMonth[key]) growthByMonth[key] = { count: 0, totalStars: 0 };
      growthByMonth[key].count++;
      growthByMonth[key].totalStars += r.stars;
    });

    const reviewGrowth = Object.entries(growthByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        reviews: data.count,
        avgRating: Math.round((data.totalStars / data.count) * 10) / 10,
      }));

    // Ratings distribution (1–5 stars)
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach((r) => {
      if (r.stars >= 1 && r.stars <= 5) distribution[r.stars]++;
    });

    // Sentiment breakdown
    const sentimentCounts = await this.prisma.rating.groupBy({
      by: ["sentiment"],
      where: { reviewRequest: { locationId: { in: locationIds } } },
      _count: true,
    });
    const sentiment = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 };
    sentimentCounts.forEach((s) => {
      if (s.sentiment) sentiment[s.sentiment] = s._count;
    });

    return {
      totalReviews,
      pendingRequests,
      responseRate,
      avgRating,
      reviewGrowth,
      ratingsDistribution: distribution,
      sentiment,
    };
  }

  async getLocationBreakdown(businessId: string, userId: string) {
    await this.assertOwner(businessId, userId);

    const locations = await this.prisma.location.findMany({
      where: { businessId },
      include: {
        _count: { select: { reviewRequests: true } },
      },
    });

    const breakdown = await Promise.all(
      locations.map(async (loc) => {
        const ratings = await this.prisma.rating.findMany({
          where: { reviewRequest: { locationId: loc.id }, isPrivate: false },
          select: { stars: true },
        });
        const avgRating =
          ratings.length > 0
            ? Math.round((ratings.reduce((a, r) => a + r.stars, 0) / ratings.length) * 10) / 10
            : null;
        return {
          id: loc.id,
          name: loc.name,
          address: loc.address,
          totalRequests: loc._count.reviewRequests,
          totalReviews: ratings.length,
          avgRating,
        };
      }),
    );

    return breakdown;
  }

  async getAdvancedAnalytics(businessId: string, userId: string) {
    await this.assertOwner(businessId, userId);

    const locationIds = await this.prisma.location
      .findMany({ where: { businessId }, select: { id: true } })
      .then((locs) => locs.map((l) => l.id));

    const ratings = await this.prisma.rating.findMany({
      where: { reviewRequest: { locationId: { in: locationIds } } },
      select: { feedback: true, stars: true },
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    const googleReviews = await this.prisma.platformReview.findMany({
      where: { locationId: { in: locationIds } },
      select: { comment: true, stars: true, platform: true },
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    const reviewsText = [
      ...ratings.filter((r) => r.feedback).map((r) => `Rating: ${r.stars}/5. Customer Feedback: "${r.feedback}"`),
      ...googleReviews.filter((g) => g.comment).map((g) => `${g.platform} Rating: ${g.stars}/5. Review Text: "${g.comment}"`),
    ].join("\n");

    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    const category = business?.category ?? "business";

    const aiAnalysis = await this.aiDrafts.analyzeFeedback(reviewsText, category);
    const overview = await this.getOverview(businessId, userId);

    return {
      trends: overview.reviewGrowth,
      wordCloud: aiAnalysis.wordCloud || [],
      recommendations: aiAnalysis.recommendations || [],
    };
  }
}
