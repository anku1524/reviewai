const { prisma } = require("./client");

async function main() {
  // Clean start to make the script re-runnable
  console.log("Cleaning up database...");
  await prisma.googleReview.deleteMany();
  await prisma.googleIntegration.deleteMany();
  await prisma.aIReviewDraft.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.reviewRequest.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.location.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.business.deleteMany();

  console.log("Seeding admin and owner...");
  const admin = await prisma.user.upsert({
    where: { email: "admin@reviewai.dev" },
    update: {
      passwordHash: "$2b$10$lzo4I5UB2oC5tzzrY9uEIecsn38FjBo2M4pdscswB7TS7JwF3MkUy",
    },
    create: {
      name: "Super Admin",
      email: "admin@reviewai.dev",
      role: "SUPER_ADMIN",
      emailVerified: true,
      passwordHash: "$2b$10$lzo4I5UB2oC5tzzrY9uEIecsn38FjBo2M4pdscswB7TS7JwF3MkUy",
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@demo-cafe.dev" },
    update: {
      passwordHash: "$2b$10$lzo4I5UB2oC5tzzrY9uEIecsn38FjBo2M4pdscswB7TS7JwF3MkUy",
    },
    create: {
      name: "Demo Owner",
      email: "owner@demo-cafe.dev",
      role: "BUSINESS_OWNER",
      emailVerified: true,
      passwordHash: "$2b$10$lzo4I5UB2oC5tzzrY9uEIecsn38FjBo2M4pdscswB7TS7JwF3MkUy",
    },
  });

  console.log("Seeding business and locations...");
  const business = await prisma.business.create({
    data: {
      ownerId: owner.id,
      name: "Demo Cafe",
      category: "Cafe",
      locations: {
        create: [{ name: "Demo Cafe - Downtown" }],
      },
      subscriptions: {
        create: [{ plan: "free", status: "ACTIVE" }],
      },
    },
  });

  const location = await prisma.location.findFirst({
    where: { businessId: business.id },
  });

  if (location) {
    console.log("Seeding review requests and ratings...");
    const mockCustomers = [
      { name: "John Smith", feedback: "The coffee was amazing but the queue was very long. Staff were nice.", stars: 4, daysAgo: 2 },
      { name: "Jane Doe", feedback: "Best cold brew in town! Clean tables and nice music.", stars: 5, daysAgo: 5 },
      { name: "Bob Johnson", feedback: "Espresso is average, wait time is a bit long on Friday.", stars: 3, daysAgo: 12 },
      { name: "Alice Brown", feedback: "Staff are so friendly. Cozy environment and top-tier muffins.", stars: 5, daysAgo: 20 },
      { name: "Charlie Green", feedback: "Great place, understaffed on weekends though.", stars: 3, daysAgo: 35 },
      { name: "Diana White", feedback: "Incredible lattes! Quick service.", stars: 5, daysAgo: 45 },
    ];

    for (const cust of mockCustomers) {
      const customer = await prisma.customer.create({
        data: {
          businessId: business.id,
          name: cust.name,
          email: `${cust.name.toLowerCase().replace(" ", "")}@example.com`,
        }
      });

      const req = await prisma.reviewRequest.create({
        data: {
          locationId: location.id,
          customerId: customer.id,
          token: `mock-token-${cust.name.toLowerCase().replace(" ", "-")}`,
          status: "COMPLETED",
          channel: "EMAIL",
          createdAt: new Date(Date.now() - cust.daysAgo * 24 * 60 * 60 * 1000),
        }
      });

      await prisma.rating.create({
        data: {
          reviewRequestId: req.id,
          stars: cust.stars,
          feedback: cust.feedback,
          createdAt: req.createdAt,
        }
      });
    }

    console.log("Seeding synced Google reviews...");
    const googleReviews = [
      { reviewer: "Sarah Jenkins", stars: 5, comment: "Outstanding service! Lattes are perfectly balanced.", daysAgo: 3 },
      { reviewer: "Michael Chang", stars: 2, comment: "Disappointed with the wait times on Friday afternoon. Service was slow.", daysAgo: 10 },
      { reviewer: "Emma Watson", stars: 4, comment: "Very clean location and cozy tables for working. Good espresso.", daysAgo: 22 },
      { reviewer: "James Carter", stars: 5, comment: "Love the cold brew! Excellent staffing, super friendly atmosphere.", daysAgo: 38 },
    ];

    for (const gr of googleReviews) {
      await prisma.googleReview.create({
        data: {
          locationId: location.id,
          reviewId: `g_rev_demo_${gr.reviewer.toLowerCase().replace(" ", "_")}`,
          reviewer: gr.reviewer,
          stars: gr.stars,
          comment: gr.comment,
          createTime: new Date(Date.now() - gr.daysAgo * 24 * 60 * 60 * 1000),
        }
      });
    }
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
export {};
