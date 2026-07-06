import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AIDraftsService } from "../ai-drafts/ai-drafts.service";

@Injectable()
export class GoogleIntegrationService {
  constructor(
    private prisma: PrismaService,
    private aiDrafts: AIDraftsService,
  ) {}

  async getOauthUrl(locationId: string) {
    const location = await this.prisma.location.findUnique({ where: { id: locationId } });
    if (!location) throw new NotFoundException("Location not found.");

    // Redirect to frontend mock authorization page
    const webUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
    return `${webUrl}/dashboard?google_oauth_callback=true&locationId=${locationId}`;
  }

  async callback(locationId: string) {
    const location = await this.prisma.location.findUnique({ where: { id: locationId } });
    if (!location) throw new NotFoundException("Location not found.");

    // Create or update GoogleIntegration
    const integration = await this.prisma.googleIntegration.upsert({
      where: { locationId },
      update: {
        accessToken: "mock_google_access_token_" + Math.random().toString(36).substring(2),
        refreshToken: "mock_google_refresh_token",
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour expiration
      },
      create: {
        locationId,
        accessToken: "mock_google_access_token",
        refreshToken: "mock_google_refresh_token",
        expiresAt: new Date(Date.now() + 3600 * 1000),
        googleLocationName: `accounts/mock-account-123/locations/${locationId}`,
      },
    });

    return integration;
  }

  async syncReviews(locationId: string) {
    const integration = await this.prisma.googleIntegration.findUnique({ where: { locationId } });
    if (!integration) {
      throw new ConflictException("Google account is not connected for this location.");
    }

    // Mock Reviews data representing real Google Reviews
    const mockReviews = [
      {
        reviewId: `g_rev_${locationId}_1`,
        reviewer: "Sarah Jenkins",
        profilePhotoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        stars: 5,
        comment: "Outstanding service! The staff was incredibly welcoming, responsive, and did a phenomenal job. Will absolutely be recommending this business to everyone.",
        createTime: new Date(Date.now() - 24 * 3600 * 1000), // 1 day ago
      },
      {
        reviewId: `g_rev_${locationId}_2`,
        reviewer: "Michael Chang",
        profilePhotoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
        stars: 2,
        comment: "Disappointed with the wait times. The lobby was crowded and it took almost 45 minutes to get checked in.",
        createTime: new Date(Date.now() - 48 * 3600 * 1000), // 2 days ago
      },
      {
        reviewId: `g_rev_${locationId}_3`,
        reviewer: "Emma Watson",
        profilePhotoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
        stars: 4,
        comment: "Very clean location and the staff made sure I got everything I needed. Will definitely return.",
        createTime: new Date(Date.now() - 72 * 3600 * 1000), // 3 days ago
      },
    ];

    const syncedReviews: any[] = [];
    for (const item of mockReviews) {
      const review = await this.prisma.platformReview.upsert({
        where: { reviewId: item.reviewId },
        update: {},
        create: {
          locationId,
          platform: "GOOGLE",
          reviewId: item.reviewId,
          reviewer: item.reviewer,
          profilePhotoUrl: item.profilePhotoUrl,
          stars: item.stars,
          comment: item.comment,
          createTime: item.createTime,
        },
      });
      syncedReviews.push(review);
    }

    return syncedReviews;
  }

  async listReviews(locationId: string) {
    return this.prisma.platformReview.findMany({
      where: { locationId, platform: "GOOGLE" },
      orderBy: { createTime: "desc" },
    });
  }

  async submitReply(reviewId: string, replyText: string) {
    const review = await this.prisma.platformReview.findUnique({
      where: { id: reviewId },
      include: { location: { include: { business: true } } },
    });

    if (!review) throw new NotFoundException("Google review not found.");

    // Simulate sending to Google Business Profile API
    console.log(`[GOOGLE BUSINESS PROFILE API] Posting Owner Response to Review ID ${review.reviewId}:`);
    console.log(`Response Text: "${replyText}"`);

    // Update locally
    return this.prisma.platformReview.update({
      where: { id: reviewId },
      data: {
        replyComment: replyText,
        replyTime: new Date(),
      },
    });
  }

  async draftReply(reviewId: string) {
    const review = await this.prisma.platformReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException("Google review not found.");
    const draft = await this.aiDrafts.generateReplyDraft(review.comment ?? "", review.stars);
    return { draft };
  }
}

