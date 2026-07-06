import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AIDraftsModule } from "../ai-drafts/ai-drafts.module";
import { GoogleIntegrationService } from "./google-integration.service";
import { GoogleIntegrationController } from "./google-integration.controller";

@Module({
  imports: [PrismaModule, AIDraftsModule],
  providers: [GoogleIntegrationService],
  controllers: [GoogleIntegrationController],
  exports: [GoogleIntegrationService],
})
export class GoogleIntegrationModule {}
