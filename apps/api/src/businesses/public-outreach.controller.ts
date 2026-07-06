import { Controller, Post, Body, UseGuards, Req } from "@nestjs/common";
import { ApiKeyGuard } from "../common/guards/api-key.guard";
import { ReviewRequestsService } from "../review-requests/review-requests.service";

@UseGuards(ApiKeyGuard)
@Controller("public")
export class PublicOutreachController {
  constructor(private reviewRequestsService: ReviewRequestsService) {}

  @Post("review-request")
  async triggerRequest(
    @Req() req: any,
    @Body() dto: { name: string; email?: string; phone?: string; channel: string; locationId?: string }
  ) {
    const businessId = req.businessId;
    return this.reviewRequestsService.createFromPublicApi(businessId, dto);
  }
}
