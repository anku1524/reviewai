import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { InviteMemberDto, UpdateMemberRoleDto } from "./dto/team.dto";

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  private async assertOwner(businessId: string, userId: string) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException("Business not found.");
    if (business.ownerId !== userId) throw new ForbiddenException("Access denied.");
    return business;
  }

  async invite(businessId: string, ownerId: string, dto: InviteMemberDto) {
    await this.assertOwner(businessId, ownerId);

    // Find or create the user account
    let user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { name: dto.name, email: dto.email, role: dto.role },
      });
    }

    // Guard: can't add the owner themselves
    if (user.id === ownerId) {
      throw new ConflictException("You are already the owner of this business.");
    }

    // Guard: already a member?
    const existing = await this.prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId: user.id } },
    });
    if (existing) throw new ConflictException("This user is already a team member.");

    return this.prisma.businessMember.create({
      data: { businessId, userId: user.id, role: dto.role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async findAll(businessId: string, ownerId: string) {
    await this.assertOwner(businessId, ownerId);
    return this.prisma.businessMember.findMany({
      where: { businessId },
      include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
      orderBy: { invitedAt: "desc" },
    });
  }

  async updateRole(memberId: string, ownerId: string, dto: UpdateMemberRoleDto) {
    const member = await this.prisma.businessMember.findUnique({
      where: { id: memberId },
      include: { business: true },
    });
    if (!member) throw new NotFoundException("Team member not found.");
    if (member.business.ownerId !== ownerId) throw new ForbiddenException("Access denied.");
    return this.prisma.businessMember.update({
      where: { id: memberId },
      data: { role: dto.role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async remove(memberId: string, ownerId: string) {
    const member = await this.prisma.businessMember.findUnique({
      where: { id: memberId },
      include: { business: true },
    });
    if (!member) throw new NotFoundException("Team member not found.");
    if (member.business.ownerId !== ownerId) throw new ForbiddenException("Access denied.");
    return this.prisma.businessMember.delete({ where: { id: memberId } });
  }
}
