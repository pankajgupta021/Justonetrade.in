import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from './lib/prisma';

async function main() {
  console.log('Migrating user phone data...');
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    if (user.phone && user.phone.length > 0) {
      let countryCode = '+91'; // default
      let contactNumber = user.phone;

      // Extract country code if starts with '+'
      const match = user.phone.match(/^(\+\d{1,4})\s*(.*)$/);
      if (match) {
        countryCode = match[1];
        contactNumber = match[2];
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          countryCode,
          contactNumber,
        }
      });
      console.log(`Updated user ${user.email}: ${countryCode} | ${contactNumber}`);
    }
  }

  console.log('Migration completed successfully.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
