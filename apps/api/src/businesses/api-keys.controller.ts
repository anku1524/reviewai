import { Controller, Post, Get, Delete, Param, Body, UseGuards, Req, NotFoundException, ForbiddenException } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/auth.guards";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";
import * as crypto from "crypto";

@UseGuards(JwtAuthGuard)
@Controller("businesses/:businessId/keys")
export class ApiKeysController {
  constructor(private prisma: PrismaService) {}

  private async assertOwner(businessId: string, userId: string) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException("Business not found.");
    if (business.ownerId !== userId) throw new ForbiddenException("Access denied.");
  }

  @Post()
  async createKey(
    @Param("businessId") businessId: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: { label: string }
  ) {
    await this.assertOwner(businessId, user.userId);
    
    // Generate secure random API key token prefixed with rev_live_
    const rawKey = `rev_live_${crypto.randomBytes(24).toString("hex")}`;

    const apiKey = await this.prisma.apiKey.create({
      data: {
        businessId,
        key: rawKey,
        label: dto.label || "Default API Key",
      },
    });

    return {
      id: apiKey.id,
      label: apiKey.label,
      key: apiKey.key, // Display the full key only once on creation
      createdAt: apiKey.createdAt,
    };
  }

  @Get()
  async listKeys(
    @Param("businessId") businessId: string,
    @CurrentUser() user: { userId: string }
  ) {
    await this.assertOwner(businessId, user.userId);

    const keys = await this.prisma.apiKey.findMany({
      where: {
        businessId,
        revoked: false,
      },
      select: {
        id: true,
        label: true,
        revoked: true,
        createdAt: true,
        key: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Mask key characters for list safety
    return keys.map((k) => ({
      id: k.id,
      label: k.label,
      key: `${k.key.slice(0, 12)}...${k.key.slice(-4)}`,
      createdAt: k.createdAt,
    }));
  }

  @Delete(":keyId")
  async revokeKey(
    @Param("businessId") businessId: string,
    @Param("keyId") keyId: string,
    @CurrentUser() user: { userId: string }
  ) {
    await this.assertOwner(businessId, user.userId);

    const key = await this.prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!key || key.businessId !== businessId) {
      throw new NotFoundException("API Key not found for this business.");
    }

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revoked: true },
    });

    return { success: true };
  }
}
