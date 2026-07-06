import { Module } from "@nestjs/common";
import { AIDraftsService } from "./ai-drafts.service";

@Module({
  providers: [AIDraftsService],
  exports: [AIDraftsService],
})
export class AIDraftsModule {}
