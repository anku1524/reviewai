import { Controller, Get, Param, Patch, Body, UseGuards, NotFoundException, ForbiddenException } from "@nestjs/common";
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
