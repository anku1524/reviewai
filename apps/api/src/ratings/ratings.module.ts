import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ReviewRequestsModule } from "../review-requests/review-requests.module";
import { AIDraftsModule } from "../ai-drafts/ai-drafts.module";
import { RatingsService } from "./ratings.service";
import { RatingsController } from "./ratings.controller";

@Module({
  imports: [PrismaModule, ReviewRequestsModule, AIDraftsModule],
  providers: [RatingsService],
  controllers: [RatingsController],
})
export class RatingsModule {}
