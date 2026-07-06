import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { RemindersService } from "./reminders.service";

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [RemindersService],
})
export class RemindersModule {}
