import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/auth.guards";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ReviewRequestsService } from "./review-requests.service";
import { CreateReviewRequestDto } from "./dto/review-request.dto";

@Controller()
export class ReviewRequestsController {
  constructor(private reviewRequestsService: ReviewRequestsService) {}

  @UseGuards(JwtAuthGuard)
  @Post("businesses/:businessId/review-requests")
  create(
    @Param("businessId") businessId: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateReviewRequestDto,
  ) {
    return this.reviewRequestsService.create(businessId, user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("businesses/:businessId/review-requests")
  findAll(
    @Param("businessId") businessId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.reviewRequestsService.findAll(businessId, user.userId);
  }

  @Get("review-requests/token/:token")
  findByToken(@Param("token") token: string) {
    return this.reviewRequestsService.findByToken(token);
  }
}
