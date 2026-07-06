import { Controller, Get, Post, Param, Body, UseGuards, NotFoundException } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/auth.guards";
import { PrismaService } from "../prisma/prisma.service";

@UseGuards(JwtAuthGuard)
@Controller("businesses/:businessId/competitors")
export class CompetitorsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async listCompetitors(@Param("businessId") businessId: string) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException("Business not found.");

    return this.prisma.competitor.findMany({
      where: { businessId },
      orderBy: { reviewCount: "desc" },
    });
  }

  @Post("sync")
  async syncCompetitors(@Param("businessId") businessId: string) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException("Business not found.");

    const category = business.category || "business";

    // Simulate finding 3 nearby competitors matching category
    const mockCompetitors = [
      {
        name: `${business.name} competitor 1 (Green Bean Cafe)`,
        category,
        rating: 4.5,
        reviewCount: 94,
      },
      {
        name: `${business.name} competitor 2 (Bean & Brew)`,
        category,
        rating: 4.3,
        reviewCount: 142,
      },
      {
        name: `${business.name} competitor 3 (Coffee House Co.)`,
        category,
        rating: 4.7,
        reviewCount: 78,
      },
    ];

    const results: any[] = [];
    for (const item of mockCompetitors) {
      // Find or create
      const competitor = await this.prisma.competitor.upsert({
        where: { id: `comp-sim-${businessId}-${item.name.replace(/\s+/g, "-").toLowerCase()}` },
        update: {
          rating: item.rating,
          reviewCount: item.reviewCount,
        },
        create: {
          id: `comp-sim-${businessId}-${item.name.replace(/\s+/g, "-").toLowerCase()}`,
          businessId,
          name: item.name,
          category: item.category,
          rating: item.rating,
          reviewCount: item.reviewCount,
        },
      });
      results.push(competitor);
    }

    return results;
  }

  @Post()
  async createCompetitor(
    @Param("businessId") businessId: string,
    @Body() dto: { name: string; rating?: number; reviewCount?: number }
  ) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException("Business not found.");

    return this.prisma.competitor.create({
      data: {
        businessId,
        name: dto.name,
        category: business.category || "business",
        rating: dto.rating || 4.2,
        reviewCount: dto.reviewCount || 10,
      },
    });
  }
}
