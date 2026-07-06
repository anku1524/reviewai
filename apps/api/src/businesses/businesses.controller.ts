import { Body, Controller, Get, Post, Patch, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/auth.guards";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { BusinessesService } from "./businesses.service";
import { CreateBusinessDto } from "./dto/create-business.dto";

@UseGuards(JwtAuthGuard)
@Controller("businesses")
export class BusinessesController {
  constructor(private businessesService: BusinessesService) {}

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateBusinessDto) {
    return this.businessesService.create(user.userId, dto);
  }

  @Get()
  findMine(@CurrentUser() user: { userId: string }) {
    return this.businessesService.findAllForOwner(user.userId);
  }

  @Patch(":id/branding")
  updateBranding(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: { logoUrl?: string; primaryColor?: string; customDomain?: string }
  ) {
    return this.businessesService.updateBranding(id, user.userId, dto);
  }

  @Post(":id/billing/upgrade")
  upgradeBilling(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string }
  ) {
    return this.businessesService.simulateUpgrade(id, user.userId);
  }
}
