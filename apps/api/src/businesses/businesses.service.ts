import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBusinessDto } from "./dto/create-business.dto";

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  create(ownerId: string, dto: CreateBusinessDto) {
    return this.prisma.business.create({
      data: {
        ownerId,
        name: dto.name,
        category: dto.category,
        timezone: dto.timezone ?? "UTC",
        subscriptions: { create: [{ plan: "free", status: "ACTIVE" }] },
      },
      include: { locations: true, subscriptions: true },
    });
  }

  findAllForOwner(ownerId: string) {
    return this.prisma.business.findMany({
      where: { ownerId },
      include: { locations: true, subscriptions: true },
    });
  }

  async updateBranding(
    businessId: string,
    ownerId: string,
    data: { logoUrl?: string; primaryColor?: string; customDomain?: string }
  ) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new Error("Business not found.");
    if (business.ownerId !== ownerId) throw new Error("Access denied.");

    return this.prisma.business.update({
      where: { id: businessId },
      data: {
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor || "#6366f1",
        customDomain: data.customDomain || null,
      },
      include: { locations: true, subscriptions: true },
    });
  }

  async simulateUpgrade(businessId: string, ownerId: string) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new Error("Business not found.");
    if (business.ownerId !== ownerId) throw new Error("Access denied.");

    // Find active subscription or create one
    const activeSub = await this.prisma.subscription.findFirst({
      where: { businessId },
    });

    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    if (activeSub) {
      return this.prisma.subscription.update({
        where: { id: activeSub.id },
        data: {
          plan: "pro",
          status: "ACTIVE",
          currentPeriodEnd: nextYear,
        },
      });
    } else {
      return this.prisma.subscription.create({
        data: {
          businessId,
          plan: "pro",
          status: "ACTIVE",
          currentPeriodEnd: nextYear,
        },
      });
    }
  }
}
