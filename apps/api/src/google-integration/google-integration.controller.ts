import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/auth.guards";
import { GoogleIntegrationService } from "./google-integration.service";

@Controller("google-integration")
export class GoogleIntegrationController {
  constructor(private googleService: GoogleIntegrationService) {}

  @UseGuards(JwtAuthGuard)
  @Get("oauth-url")
  getOauthUrl(@Query("locationId") locationId: string) {
    return this.googleService.getOauthUrl(locationId);
  }

  // Public callback URL because Google redirects back without client JWT headers
  @Get("callback")
  callback(@Query("locationId") locationId: string) {
    return this.googleService.callback(locationId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("locations/:locationId/sync")
  syncReviews(@Param("locationId") locationId: string) {
    return this.googleService.syncReviews(locationId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("locations/:locationId/reviews")
  listReviews(@Param("locationId") locationId: string) {
    return this.googleService.listReviews(locationId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("reviews/:id/reply")
  submitReply(@Param("id") id: string, @Body() dto: { replyText: string }) {
    return this.googleService.submitReply(id, dto.replyText);
  }

  @UseGuards(JwtAuthGuard)
  @Post("reviews/:id/draft-reply")
  draftReply(@Param("id") id: string) {
    return this.googleService.draftReply(id);
  }
}

