import { Controller, Get, Post, Patch, Param, Body, UseGuards, NotFoundException, BadRequestException } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/auth.guards";
import { SuperAdminGuard } from "../common/guards/super-admin.guard";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";

@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller("admin")
export class AdminController {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService
  ) {}

  @Get("stats")
  async getSystemStats() {
    const totalUsers = await this.prisma.user.count();
    const totalBusinesses = await this.prisma.business.count();
    const totalLocations = await this.prisma.location.count();
    const totalReviews = await this.prisma.platformReview.count();
    const totalRequests = await this.prisma.reviewRequest.count();
    const totalAiDrafts = await this.prisma.aIReviewDraft.count();

    // Calculate system-wide average rating
    const ratingAggregate = await this.prisma.platformReview.aggregate({
      _avg: { stars: true },
    });

    const averageRating = ratingAggregate._avg.stars || 0.0;

    // AI drafts usage breakdown by business
    const businesses = await this.prisma.business.findMany({
      include: {
        locations: {
          include: {
            reviewRequests: {
              include: {
                rating: {
                  include: {
                    draft: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const aiUsage = businesses.map((b) => {
      let draftsCount = 0;
      let requestsCount = 0;
      b.locations.forEach((loc) => {
        requestsCount += loc.reviewRequests.length;
        loc.reviewRequests.forEach((req) => {
          if (req.rating?.draft) {
            draftsCount++;
          }
        });
      });
      return {
        businessId: b.id,
        businessName: b.name,
        requestsCount,
        draftsCount,
      };
    });

    return {
      kpis: {
        totalUsers,
        totalBusinesses,
        totalLocations,
        totalReviews,
        totalRequests,
        totalAiDrafts,
        averageRating: Number(averageRating.toFixed(2)),
      },
      aiUsage,
    };
  }

  @Get("users")
  async listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        suspended: true,
        createdAt: true,
        ownedBusinesses: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  @Patch("users/:id/role")
  async updateUserRole(@Param("id") id: string, @Body() dto: { role: string }) {
    if (!["SUPER_ADMIN", "BUSINESS_OWNER"].includes(dto.role)) {
      throw new BadRequestException("Invalid role tier.");
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found.");

    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
    });
  }

  @Post("users/:id/toggle-status")
  async toggleUserStatus(@Param("id") id: string, @Body() dto: { suspended: boolean }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found.");

    return this.prisma.user.update({
      where: { id },
      data: { suspended: dto.suspended },
    });
  }

  @Post("users/:id/impersonate")
  async impersonateUser(@Param("id") id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found.");

    // Sign target user token
    const tokenPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwt.sign(tokenPayload);

    return { accessToken };
  }

  @Get("businesses")
  async listBusinesses() {
    return this.prisma.business.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        locations: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                platformReviews: true,
              },
            },
          },
        },
        subscriptions: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  @Patch("businesses/:id/subscription")
  async overrideSubscription(
    @Param("id") id: string,
    @Body() dto: { plan: string; status: string; currentPeriodEnd?: string }
  ) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) throw new NotFoundException("Business not found.");

    const periodEnd = dto.currentPeriodEnd ? new Date(dto.currentPeriodEnd) : null;

    const existingSub = await this.prisma.subscription.findFirst({
      where: { businessId: id },
    });

    if (existingSub) {
      return this.prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          plan: dto.plan,
          status: dto.status,
          currentPeriodEnd: periodEnd,
        },
      });
    } else {
      return this.prisma.subscription.create({
        data: {
          businessId: id,
          plan: dto.plan,
          status: dto.status,
          currentPeriodEnd: periodEnd,
        },
      });
    }
  }

  // System Configurations & Prompts Manager
  @Get("config/prompt")
  async getPromptConfig() {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key: "gemini_review_prompt" },
    });

    return {
      prompt: config?.value || "",
    };
  }

  @Post("config/prompt")
  async savePromptConfig(@Body() dto: { value: string }) {
    if (!dto.value || !dto.value.trim()) {
      throw new BadRequestException("Prompt value cannot be empty.");
    }

    return this.prisma.systemConfig.upsert({
      where: { key: "gemini_review_prompt" },
      update: { value: dto.value },
      create: { key: "gemini_review_prompt", value: dto.value },
    });
  }

  // Global Customer Support Tickets Inspector
  @Get("tickets")
  async listGlobalTickets() {
    return this.prisma.ticket.findMany({
      include: {
        business: {
          select: { id: true, name: true },
        },
        location: {
          select: { id: true, name: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        rating: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  @Patch("tickets/:id")
  async adminUpdateTicket(
    @Param("id") ticketId: string,
    @Body() dto: { status?: string; assignedTo?: string; resolution?: string }
  ) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException("Ticket not found.");

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: dto.status,
        assignedTo: dto.assignedTo,
        resolution: dto.resolution,
      },
      include: {
        business: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
