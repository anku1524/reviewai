import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReviewRequestDto } from "./dto/review-request.dto";
import * as crypto from "crypto";

@Injectable()
export class ReviewRequestsService {
  constructor(private prisma: PrismaService) {}

  private async assertOwner(businessId: string, userId: string) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException("Business not found.");
    if (business.ownerId !== userId) throw new ForbiddenException("Access denied.");
  }

  async create(businessId: string, userId: string, dto: CreateReviewRequestDto) {
    await this.assertOwner(businessId, userId);

    // Verify location
    const location = await this.prisma.location.findUnique({ where: { id: dto.locationId } });
    if (!location || location.businessId !== businessId) {
      throw new NotFoundException("Location not found for this business.");
    }

    // Find or create customer
    const orConditions = [
      ...(dto.customerEmail ? [{ email: dto.customerEmail }] : []),
      ...(dto.customerPhone ? [{ phone: dto.customerPhone }] : []),
    ];

    let customer: any = null;
    if (orConditions.length > 0) {
      customer = await this.prisma.customer.findFirst({
        where: {
          businessId,
          OR: orConditions,
        },
      });
    }

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          businessId,
          name: dto.customerName,
          email: dto.customerEmail,
          phone: dto.customerPhone,
        },
      });
    }

    // Generate unique token
    const token = crypto.randomUUID();

    // Create review request
    return this.prisma.reviewRequest.create({
      data: {
        token,
        customerId: customer.id,
        locationId: dto.locationId,
        channel: dto.channel,
        status: "SENT",
        sentAt: new Date(),
      },
      include: {
        customer: true,
        location: true,
      },
    });
  }

  async findAll(businessId: string, userId: string) {
    await this.assertOwner(businessId, userId);
    return this.prisma.reviewRequest.findMany({
      where: { location: { businessId } },
      include: {
        customer: true,
        location: true,
        rating: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const request = await this.prisma.reviewRequest.findUnique({
      where: { id },
      include: {
        customer: true,
        location: {
          include: {
            business: true,
          },
        },
        rating: {
          include: {
            draft: true,
          },
        },
      },
    });

    if (!request) throw new NotFoundException("Review request not found.");
    return request;
  }

  async findByToken(token: string) {
    const request = await this.prisma.reviewRequest.findUnique({
      where: { token },
      include: {
        customer: true,
        location: {
          include: {
            business: true,
          },
        },
        rating: {
          include: {
            draft: true,
          },
        },
      },
    });

    if (!request) throw new NotFoundException("Review request not found.");
    return request;
  }

  async createFromPublicApi(businessId: string, dto: { name: string; email?: string; phone?: string; channel: string; locationId?: string }) {
    let locationId = dto.locationId;
    if (!locationId) {
      const firstLoc = await this.prisma.location.findFirst({ where: { businessId } });
      if (!firstLoc) {
        throw new NotFoundException("No location registered for this business.");
      }
      locationId = firstLoc.id;
    } else {
      const location = await this.prisma.location.findUnique({ where: { id: locationId } });
      if (!location || location.businessId !== businessId) {
        throw new NotFoundException("Location not found for this business.");
      }
    }

    const orConditions = [
      ...(dto.email ? [{ email: dto.email }] : []),
      ...(dto.phone ? [{ phone: dto.phone }] : []),
    ];

    let customer: any = null;
    if (orConditions.length > 0) {
      customer = await this.prisma.customer.findFirst({
        where: {
          businessId,
          OR: orConditions,
        },
      });
    }

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          businessId,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
        },
      });
    }

    const token = crypto.randomUUID();

    return this.prisma.reviewRequest.create({
      data: {
        token,
        customerId: customer.id,
        locationId,
        channel: dto.channel,
        status: "SENT",
        sentAt: new Date(),
      },
      include: {
        customer: true,
        location: true,
      },
    });
  }
}
