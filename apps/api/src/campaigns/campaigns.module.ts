import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { CampaignsService } from "./campaigns.service";
import { CampaignsController } from "./campaigns.controller";

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [CampaignsService],
  controllers: [CampaignsController],
  exports: [CampaignsService],
})
export class CampaignsModule {}
