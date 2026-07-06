import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { BusinessesModule } from "./businesses/businesses.module";
import { LocationsModule } from "./locations/locations.module";
import { TeamModule } from "./team/team.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { ReviewRequestsModule } from "./review-requests/review-requests.module";
import { AIDraftsModule } from "./ai-drafts/ai-drafts.module";
import { RatingsModule } from "./ratings/ratings.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { CampaignsModule } from "./campaigns/campaigns.module";
import { RemindersModule } from "./reminders/reminders.module";
import { GoogleIntegrationModule } from "./google-integration/google-integration.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    BusinessesModule,
    LocationsModule,
    TeamModule,
    AnalyticsModule,
    ReviewRequestsModule,
    AIDraftsModule,
    RatingsModule,
    NotificationsModule,
    CampaignsModule,
    RemindersModule,
    GoogleIntegrationModule,
  ],
})
export class AppModule {}
