import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateCampaignDto } from "./dto/campaigns.dto";
import * as crypto from "crypto";

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  private async assertOwner(businessId: string, userId: string) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException("Business not found.");
    if (business.ownerId !== userId) throw new ForbiddenException("Access denied.");
    return business;
  }

  async create(businessId: string, userId: string, dto: CreateCampaignDto) {
    const business = await this.assertOwner(businessId, userId);

    // Verify location
    const location = await this.prisma.location.findUnique({ where: { id: dto.locationId } });
    if (!location || location.businessId !== businessId) {
      throw new NotFoundException("Location not found.");
    }

    // 1. Create Campaign
    const campaign = await this.prisma.campaign.create({
      data: {
        businessId,
        name: dto.name,
        channel: dto.channel,
      },
    });

    // 2. Loop over customers and create review requests
    const webUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

    for (const c of dto.customers) {
      // Find or create customer
      const orConditions = [
        ...(c.email ? [{ email: c.email }] : []),
        ...(c.phone ? [{ phone: c.phone }] : []),
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
            name: c.name,
            email: c.email,
            phone: c.phone,
          },
        });
      }

      // Create request
      const token = crypto.randomUUID();
      await this.prisma.reviewRequest.create({
        data: {
          token,
          customerId: customer.id,
          locationId: dto.locationId,
          campaignId: campaign.id,
          channel: dto.channel,
          status: "SENT",
          sentAt: new Date(),
        },
      });

      // Dispatch invitation notification
      const portalLink = `${webUrl}/r/${token}`;
      const inviteMsg = `Hi ${c.name}, thank you for visiting ${business.name} (${location.name}). Please share your experience here: ${portalLink}`;

      if (dto.channel === "EMAIL" && c.email) {
        await this.notifications.sendEmail(
          business.ownerId,
          c.email,
          `How was your experience at ${business.name}?`,
          inviteMsg,
          portalLink,
        );
      } else if (dto.channel === "SMS" && c.phone) {
        await this.notifications.sendSMS(business.ownerId, c.phone, inviteMsg, portalLink);
      } else if (dto.channel === "WHATSAPP" && c.phone) {
        await this.notifications.sendWhatsApp(business.ownerId, c.phone, "review_invite_v1", portalLink);
      }
    }

    // 3. Log Audit
    await this.notifications.logAudit(businessId, userId, "CREATE_CAMPAIGN", {
      campaignId: campaign.id,
      customerCount: dto.customers.length,
    });

    return campaign;
  }

  async findAll(businessId: string, userId: string) {
    await this.assertOwner(businessId, userId);
    return this.prisma.campaign.findMany({
      where: { businessId },
      include: {
        _count: {
          select: { reviewRequests: true },
        },
        reviewRequests: {
          select: {
            status: true,
            rating: {
              select: { stars: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(businessId: string, id: string, userId: string) {
    await this.assertOwner(businessId, userId);

    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        reviewRequests: {
          include: {
            customer: true,
            location: true,
            rating: true,
          },
        },
      },
    });

    if (!campaign || campaign.businessId !== businessId) {
      throw new NotFoundException("Campaign not found.");
    }

    return campaign;
  }
}
