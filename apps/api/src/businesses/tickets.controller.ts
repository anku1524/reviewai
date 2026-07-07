import { Controller, Get, Post, Patch, Param, Body, Req, UseGuards, NotFoundException, ForbiddenException } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/auth.guards";
import { PrismaService } from "../prisma/prisma.service";

@UseGuards(JwtAuthGuard)
@Controller("businesses/:businessId/tickets")
export class TicketsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async listTickets(@Param("businessId") businessId: string) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException("Business not found.");

    return this.prisma.ticket.findMany({
      where: { businessId },
      include: {
        location: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        rating: {
          include: {
            reviewRequest: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  @Post()
  async createSupportTicket(
    @Param("businessId") businessId: string,
    @Req() req: any,
    @Body() dto: { title: string; description: string; priority?: string }
  ) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException("Business not found.");

    const creatorId = req.user.sub;

    return this.prisma.ticket.create({
      data: {
        businessId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority || "MEDIUM",
        creatorId,
        status: "OPEN",
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  @Patch(":id")
  async updateTicket(
    @Param("businessId") businessId: string,
    @Param("id") ticketId: string,
    @Body() dto: { status?: string; assignedTo?: string; resolution?: string }
  ) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException("Ticket not found.");
    if (ticket.businessId !== businessId) {
      throw new ForbiddenException("You do not have access to this ticket.");
    }

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: dto.status,
        assignedTo: dto.assignedTo,
        resolution: dto.resolution,
      },
      include: {
        location: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        rating: {
          include: {
            reviewRequest: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
    });
  }
}
