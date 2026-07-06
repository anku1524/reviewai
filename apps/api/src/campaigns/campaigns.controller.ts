import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/auth.guards";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CampaignsService } from "./campaigns.service";
import { CreateCampaignDto } from "./dto/campaigns.dto";

@UseGuards(JwtAuthGuard)
@Controller("businesses/:businessId/campaigns")
export class CampaignsController {
  constructor(private campaignsService: CampaignsService) {}

  @Post()
  create(
    @Param("businessId") businessId: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateCampaignDto,
  ) {
    return this.campaignsService.create(businessId, user.userId, dto);
  }

  @Get()
  findAll(
    @Param("businessId") businessId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.campaignsService.findAll(businessId, user.userId);
  }

  @Get(":id")
  findOne(
    @Param("businessId") businessId: string,
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.campaignsService.findOne(businessId, id, user.userId);
  }
}
