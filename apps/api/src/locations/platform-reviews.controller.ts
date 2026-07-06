import { Controller, Post, Get, Param, Body, UseGuards, NotFoundException } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/auth.guards";
import { PrismaService } from "../prisma/prisma.service";

@UseGuards(JwtAuthGuard)
@Controller("locations/:locationId")
export class PlatformReviewsController {
  constructor(private prisma: PrismaService) {}

  @Post("sync-all")
  async syncAll(@Param("locationId") locationId: string) {
    const location = await this.prisma.location.findUnique({ where: { id: locationId } });
    if (!location) throw new NotFoundException("Location not found.");

    const mockReviews = [
      {
        platform: "YELP",
        reviewId: `yelp-sync-${locationId}`,
        reviewer: "Michael Chang",
        profilePhotoUrl: null,
        stars: 4,
        comment: "Excellent lattes and quick service, but seats are sparse on Friday.",
        createTime: new Date(Date.now() - 48 * 3600 * 1000), // 2 days ago
      },
      {
        platform: "FACEBOOK",
        reviewId: `fb-sync-${locationId}`,
        reviewer: "Emma Watson",
        profilePhotoUrl: null,
        stars: 5,
        comment: "Staff is extremely friendly and clean workspace!",
        createTime: new Date(Date.now() - 24 * 3600 * 1000), // 1 day ago
      },
      {
        platform: "TRIPADVISOR",
        reviewId: `ta-sync-${locationId}`,
        reviewer: "Sarah Jenkins",
        profilePhotoUrl: null,
        stars: 5,
        comment: "Great spot to get work done. High recommended!",
        createTime: new Date(Date.now() - 12 * 3600 * 1000), // 12 hours ago
      },
      {
        platform: "GOOGLE",
        reviewId: `google-sync-${locationId}`,
        reviewer: "David Miller",
        profilePhotoUrl: null,
        stars: 5,
        comment: "Amazing coffee quality and awesome environment.",
        createTime: new Date(Date.now() - 6 * 3600 * 1000), // 6 hours ago
      },
    ];

    const syncedReviews: any[] = [];
    for (const item of mockReviews) {
      const review = await this.prisma.platformReview.upsert({
        where: { reviewId: item.reviewId },
        update: {
          comment: item.comment,
          stars: item.stars,
        },
        create: {
          locationId,
          platform: item.platform,
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

  @Get("platform-reviews")
  async listReviews(@Param("locationId") locationId: string) {
    const location = await this.prisma.location.findUnique({ where: { id: locationId } });
    if (!location) throw new NotFoundException("Location not found.");

    return this.prisma.platformReview.findMany({
      where: { locationId },
      orderBy: { createTime: "desc" },
    });
  }

  @Post("social-share/:reviewId")
  async shareReview(
    @Param("locationId") locationId: string,
    @Param("reviewId") reviewId: string,
    @Body() dto: { platform: string }
  ) {
    const review = await this.prisma.platformReview.findUnique({
      where: { id: reviewId },
      include: { location: { include: { business: true } } },
    });

    if (!review || review.locationId !== locationId) {
      throw new NotFoundException("Review not found for this location.");
    }

    // Create share log inside SocialPostHistory
    const log = await this.prisma.socialPostHistory.create({
      data: {
        businessId: review.location.businessId,
        platform: dto.platform,
        reviewer: review.reviewer,
        stars: review.stars,
        comment: review.comment,
      },
    });

    return {
      success: true,
      sharedLogId: log.id,
      platform: dto.platform,
    };
  }
}
