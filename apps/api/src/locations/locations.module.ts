import { Module } from "@nestjs/common";
import { LocationsController } from "./locations.controller";
import { PublicLocationsController } from "./public-locations.controller";
import { PlatformReviewsController } from "./platform-reviews.controller";
import { LocationsService } from "./locations.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [LocationsController, PublicLocationsController, PlatformReviewsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
