import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ReviewRequestsService } from "./review-requests.service";
import { ReviewRequestsController } from "./review-requests.controller";

@Module({
  imports: [PrismaModule],
  providers: [ReviewRequestsService],
  controllers: [ReviewRequestsController],
  exports: [ReviewRequestsService],
})
export class ReviewRequestsModule {}
