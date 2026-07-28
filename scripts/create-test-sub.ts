import { prisma } from '../lib/prisma';

async function main() {
  const phone = process.argv[2];

  if (!phone) {
    console.error("❌ Please provide a phone number to test WhatsApp with.");
    console.log("Usage: npx tsx scripts/create-test-sub.ts '+1234567890'");
    process.exit(1);
  }

  // Create a fake active subscriber
  const user = await prisma.user.create({
    data: {
      fullName: "Test Subscriber",
      email: `testsub_${Date.now()}@example.com`,
      phone: phone,
      passwordHash: "fakehash", // Cannot login, just for admin testing
      role: "SUBSCRIBER",
      isActive: true,
      subscriptions: {
        create: {
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
        }
      }
    },
  });

  console.log(`✅ Created active subscriber: ${user.fullName} (${user.phone})`);
  console.log("👉 Go refresh your Admin Dashboard!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
