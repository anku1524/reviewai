import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async sendEmail(userId: string | null, email: string, subject: string, message: string, link?: string) {
    console.log(`[EMAIL SENDER] Dispatched email to: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${message}`);
    if (link) console.log(`Link: ${link}`);

    if (userId) {
      await this.prisma.notification.create({
        data: {
          userId,
          type: "EMAIL",
          message: `Email sent to ${email}: ${subject}`,
        },
      });
    }
  }

  async sendSMS(userId: string | null, phone: string, message: string, link?: string) {
    console.log(`[SMS SENDER] Dispatched SMS to: ${phone}`);
    console.log(`Body: ${message}`);
    if (link) console.log(`Link: ${link}`);

    if (userId) {
      await this.prisma.notification.create({
        data: {
          userId,
          type: "SMS",
          message: `SMS sent to ${phone}`,
        },
      });
    }
  }

  async sendWhatsApp(userId: string | null, phone: string, templateName: string, link?: string) {
    console.log(`[WHATSAPP SENDER] Dispatched WhatsApp Template "${templateName}" to: ${phone}`);
    if (link) console.log(`Template Variable (Link): ${link}`);

    if (userId) {
      await this.prisma.notification.create({
        data: {
          userId,
          type: "WHATSAPP",
          message: `WhatsApp template "${templateName}" sent to ${phone}`,
        },
      });
    }
  }

  async logAudit(businessId: string, userId: string, action: string, metadata?: any) {
    await this.prisma.auditLog.create({
      data: {
        businessId,
        userId,
        action,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  }
}
