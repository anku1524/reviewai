import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers["x-api-key"];

    if (!apiKey) {
      throw new UnauthorizedException("API Key is missing in request headers.");
    }

    const keyRecord = await this.prisma.apiKey.findFirst({
      where: {
        key: String(apiKey),
        revoked: false,
      },
      include: {
        business: true,
      },
    });

    if (!keyRecord) {
      throw new UnauthorizedException("Invalid or revoked API Key.");
    }

    // Attach business context to request for downstream controller routes
    request.businessId = keyRecord.businessId;
    request.business = keyRecord.business;
    return true;
  }
}
