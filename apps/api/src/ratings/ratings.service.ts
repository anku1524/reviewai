import { Injectable, ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ReviewRequestsService } from "../review-requests/review-requests.service";
import { AIDraftsService } from "../ai-drafts/ai-drafts.service";
import { SubmitRatingDto, RegenerateDraftDto } from "./dto/rating.dto";
import { GuestSubmitRatingDto } from "./dto/guest-submit.dto";
import * as crypto from "crypto";

@Injectable()
export class RatingsService {
  constructor(
    private prisma: PrismaService,
    private reviewRequests: ReviewRequestsService,
    private aiDrafts: AIDraftsService,
  ) {}

  async submit(token: string, dto: SubmitRatingDto) {
    const request = await this.reviewRequests.findByToken(token);

    if (request.rating) {
      throw new ConflictException("Feedback has already been submitted for this request.");
    }

    const isPrivate = dto.stars <= 3;
    const sentiment = dto.stars >= 4 ? "POSITIVE" : dto.stars === 3 ? "NEUTRAL" : "NEGATIVE";

    // Create Rating
    const rating = await this.prisma.rating.create({
      data: {
        reviewRequestId: request.id,
        stars: dto.stars,
        feedback: dto.feedback,
        sentiment,
        isPrivate,
      },
    });

    // Update request status to COMPLETED
    await this.prisma.reviewRequest.update({
      where: { id: request.id },
      data: { status: "COMPLETED" },
    });

    if (isPrivate) {
      await this.prisma.ticket.create({
        data: {
          businessId: request.location.businessId,
          locationId: request.locationId,
          ratingId: rating.id,
          status: "OPEN",
        },
      });
      console.log(`[NOTIFICATION DAEMON] Low rating Alert: New feedback ticket spawned automatically for rating ID ${rating.id}`);
    }

    // Generate AI draft for positive ratings
    let draft: any = null;
    if (!isPrivate) {
      const generatedText = await this.aiDrafts.generateReviewDraft(
        request.location.business.category,
        dto.stars,
        dto.keywords ?? dto.feedback ?? "",
        dto.tone ?? "professional",
      );

      draft = await this.prisma.aIReviewDraft.create({
        data: {
          ratingId: rating.id,
          draft: generatedText,
          tone: dto.tone ?? "professional",
        },
      });
    }

    return {
      rating,
      draft,
    };
  }

  async regenerate(token: string, dto: RegenerateDraftDto) {
    const request = await this.reviewRequests.findByToken(token);
    if (!request.rating) {
      throw new ConflictException("No rating exists yet to generate drafts for.");
    }

    if (request.rating.isPrivate) {
      throw new ForbiddenException("Cannot generate public drafts for private negative feedback.");
    }

    const existingDraft = await this.prisma.aIReviewDraft.findUnique({
      where: { ratingId: request.rating.id },
    });

    const generatedText = await this.aiDrafts.generateReviewDraft(
      request.location.business.category,
      request.rating.stars,
      dto.keywords ?? request.rating.feedback ?? "",
      dto.tone,
    );

    if (existingDraft) {
      return this.prisma.aIReviewDraft.update({
        where: { id: existingDraft.id },
        data: {
          draft: generatedText,
          tone: dto.tone,
          regenerated: { increment: 1 },
        },
      });
    } else {
      return this.prisma.aIReviewDraft.create({
        data: {
          ratingId: request.rating.id,
          draft: generatedText,
          tone: dto.tone,
        },
      });
    }
  }

  async guestSubmit(locationId: string, dto: GuestSubmitRatingDto) {
    // 1. Verify Location
    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
      include: { business: true },
    });
    if (!location) throw new NotFoundException("Location not found.");

    const businessId = location.businessId;

    // 2. Find or Create Customer
    let customer: any = null;
    if (dto.customerEmail || dto.customerPhone) {
      customer = await this.prisma.customer.findFirst({
        where: {
          businessId,
          OR: [
            ...(dto.customerEmail ? [{ email: dto.customerEmail }] : []),
            ...(dto.customerPhone ? [{ phone: dto.customerPhone }] : []),
          ],
        },
      });
    }

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          businessId,
          name: dto.customerName || "Guest Customer",
          email: dto.customerEmail,
          phone: dto.customerPhone,
        },
      });
    }

    // 3. Create completed review request
    const token = crypto.randomUUID();
    const request = await this.prisma.reviewRequest.create({
      data: {
        token,
        customerId: customer.id,
        locationId: locationId,
        channel: "QR",
        status: "COMPLETED",
        sentAt: new Date(),
      },
    });

    // 4. Save Rating
    const isPrivate = dto.stars <= 3;
    const sentiment = dto.stars >= 4 ? "POSITIVE" : dto.stars === 3 ? "NEUTRAL" : "NEGATIVE";

    const rating = await this.prisma.rating.create({
      data: {
        reviewRequestId: request.id,
        stars: dto.stars,
        feedback: dto.feedback,
        sentiment,
        isPrivate,
      },
    });

    if (isPrivate) {
      await this.prisma.ticket.create({
        data: {
          businessId: location.businessId,
          locationId: locationId,
          ratingId: rating.id,
          status: "OPEN",
        },
      });
      console.log(`[NOTIFICATION DAEMON] Low rating Alert: New guest feedback ticket spawned automatically for rating ID ${rating.id}`);
    }

    // 5. Generate AI draft
    let draft: any = null;
    if (!isPrivate) {
      const generatedText = await this.aiDrafts.generateReviewDraft(
        location.business.category,
        dto.stars,
        dto.keywords ?? dto.feedback ?? "",
        dto.tone ?? "professional",
      );

      draft = await this.prisma.aIReviewDraft.create({
        data: {
          ratingId: rating.id,
          draft: generatedText,
          tone: dto.tone ?? "professional",
        },
      });
    }

    return {
      rating,
      draft,
      token,
    };
  }
}
