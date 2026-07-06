import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class RemindersService implements OnModuleInit, OnModuleDestroy {
  private intervalRef: NodeJS.Timeout | null = null;

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  onModuleInit() {
    console.log("[SCHEDULER] Reminders background cron worker started (polling every 30 seconds)...");
    this.intervalRef = setInterval(() => this.checkAndSendReminders(), 30000);
  }

  onModuleDestroy() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      console.log("[SCHEDULER] Reminders worker stopped.");
    }
  }

  async checkAndSendReminders() {
    console.log("[SCHEDULER] Scanning for pending review requests requiring follow-ups...");

    // Threshold: requests sent more than 45 seconds ago (simulating 3 days / 7 days for sandbox visibility)
    const threshold = new Date(Date.now() - 45000);

    // 1. First Reminders: SENT status -> transition to OPENED
    const pendingFirst = await this.prisma.reviewRequest.findMany({
      where: {
        status: "SENT",
        sentAt: { lt: threshold },
      },
      include: {
        customer: true,
        location: { include: { business: true } },
      },
    });

    for (const req of pendingFirst) {
      const bizName = req.location.business.name;
      const custName = req.customer.name;
      const portalLink = `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/r/${req.token}`;
      const msg = `Hi ${custName}, just a friendly reminder to share your thoughts about your visit to ${bizName}: ${portalLink}`;

      console.log(`[SCHEDULER] Auto-sending 1st reminder to ${custName} (${req.id})...`);
      
      if (req.channel === "EMAIL" && req.customer.email) {
        await this.notifications.sendEmail(req.location.business.ownerId, req.customer.email, `We'd love your feedback! - ${bizName}`, msg, portalLink);
      } else if (req.customer.phone) {
        await this.notifications.sendSMS(req.location.business.ownerId, req.customer.phone, msg, portalLink);
      }

      await this.prisma.reviewRequest.update({
        where: { id: req.id },
        data: { status: "OPENED", sentAt: new Date() }, // Update sentAt to restart threshold timer
      });
    }

    // 2. Second Reminders: OPENED status -> transition to CLICKED
    const pendingSecond = await this.prisma.reviewRequest.findMany({
      where: {
        status: "OPENED",
        sentAt: { lt: threshold },
      },
      include: {
        customer: true,
        location: { include: { business: true } },
      },
    });

    for (const req of pendingSecond) {
      const bizName = req.location.business.name;
      const custName = req.customer.name;
      const portalLink = `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/r/${req.token}`;
      const msg = `Hi ${custName}, we'd really value your 30-second review to help ${bizName} improve: ${portalLink}`;

      console.log(`[SCHEDULER] Auto-sending 2nd reminder to ${custName} (${req.id})...`);

      if (req.channel === "EMAIL" && req.customer.email) {
        await this.notifications.sendEmail(req.location.business.ownerId, req.customer.email, `Help us improve! - ${bizName}`, msg, portalLink);
      } else if (req.customer.phone) {
        await this.notifications.sendSMS(req.location.business.ownerId, req.customer.phone, msg, portalLink);
      }

      await this.prisma.reviewRequest.update({
        where: { id: req.id },
        data: { status: "CLICKED", sentAt: new Date() },
      });
    }
  }
}
