import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/auth.guards";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AnalyticsService } from "./analytics.service";

@UseGuards(JwtAuthGuard)
@Controller("businesses/:businessId/analytics")
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get("overview")
  overview(
    @Param("businessId") businessId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.analyticsService.getOverview(businessId, user.userId);
  }

  @Get("locations")
  locationBreakdown(
    @Param("businessId") businessId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.analyticsService.getLocationBreakdown(businessId, user.userId);
  }

  @Get("advanced")
  advanced(
    @Param("businessId") businessId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.analyticsService.getAdvancedAnalytics(businessId, user.userId);
  }
}
