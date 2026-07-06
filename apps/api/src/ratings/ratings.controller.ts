import { Body, Controller, Param, Post } from "@nestjs/common";
import { RatingsService } from "./ratings.service";
import { SubmitRatingDto, RegenerateDraftDto } from "./dto/rating.dto";
import { GuestSubmitRatingDto } from "./dto/guest-submit.dto";

@Controller()
export class RatingsController {
  constructor(private ratingsService: RatingsService) {}

  // Request-based submission
  @Post("review-requests/token/:token/submit")
  submit(@Param("token") token: string, @Body() dto: SubmitRatingDto) {
    return this.ratingsService.submit(token, dto);
  }

  // Request-based draft regeneration
  @Post("review-requests/token/:token/regenerate")
  regenerate(@Param("token") token: string, @Body() dto: RegenerateDraftDto) {
    return this.ratingsService.regenerate(token, dto);
  }

  // Location-based direct submission (QR scan)
  @Post("locations/:locationId/guest-submit")
  guestSubmit(@Param("locationId") locationId: string, @Body() dto: GuestSubmitRatingDto) {
    return this.ratingsService.guestSubmit(locationId, dto);
  }
}
