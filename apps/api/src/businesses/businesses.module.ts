import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ReviewRequestsModule } from "../review-requests/review-requests.module";
import { BusinessesController } from "./businesses.controller";
import { ApiKeysController } from "./api-keys.controller";
import { PublicOutreachController } from "./public-outreach.controller";
import { PublicWidgetsController } from "./public-widgets.controller";
import { TicketsController } from "./tickets.controller";
import { CompetitorsController } from "./competitors.controller";
import { BusinessesService } from "./businesses.service";

@Module({
  imports: [PrismaModule, ReviewRequestsModule],
  controllers: [
    BusinessesController,
    ApiKeysController,
    PublicOutreachController,
    PublicWidgetsController,
    TicketsController,
    CompetitorsController,
  ],
  providers: [BusinessesService],
})
export class BusinessesModule {}
