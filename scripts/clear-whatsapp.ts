import { prisma } from "../lib/prisma";

async function main() {
  await prisma.whatsAppAuth.deleteMany({});
  await prisma.whatsAppState.upsert({
    where: { key: "singleton" },
    update: { status: "disconnected", qrCodeDataUrl: null, connectedNumber: null, groupsJson: "[]" },
    create: { key: "singleton", status: "disconnected", qrCodeDataUrl: null, connectedNumber: null, groupsJson: "[]" },
  });
  console.log("✅ WhatsApp DB state cleared — ready for a fresh scan");
  await prisma.$disconnect();
}

main().catch(console.error);
