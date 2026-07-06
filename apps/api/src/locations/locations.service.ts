import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLocationDto, UpdateLocationDto } from "./dto/location.dto";

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  private async assertOwner(businessId: string, userId: string) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException("Business not found.");
    if (business.ownerId !== userId) throw new ForbiddenException("Access denied.");
    return business;
  }

  async create(businessId: string, userId: string, dto: CreateLocationDto) {
    await this.assertOwner(businessId, userId);
    return this.prisma.location.create({
      data: { businessId, name: dto.name, address: dto.address, googlePlaceId: dto.googlePlaceId },
    });
  }

  async findAll(businessId: string, userId: string) {
    await this.assertOwner(businessId, userId);
    return this.prisma.location.findMany({
      where: { businessId },
      include: {
        _count: { select: { reviewRequests: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(locationId: string, userId: string, dto: UpdateLocationDto) {
    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
      include: { business: true },
    });
    if (!location) throw new NotFoundException("Location not found.");
    if (location.business.ownerId !== userId) throw new ForbiddenException("Access denied.");
    return this.prisma.location.update({ where: { id: locationId }, data: dto });
  }

  async remove(locationId: string, userId: string) {
    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
      include: { business: true },
    });
    if (!location) throw new NotFoundException("Location not found.");
    if (location.business.ownerId !== userId) throw new ForbiddenException("Access denied.");
    return this.prisma.location.delete({ where: { id: locationId } });
  }

  async findOnePublic(id: string) {
    const location = await this.prisma.location.findUnique({
      where: { id },
      include: {
        business: {
          select: { name: true, category: true, logoUrl: true },
        },
      },
    });
    if (!location) throw new NotFoundException("Location not found.");
    return location;
  }
}

