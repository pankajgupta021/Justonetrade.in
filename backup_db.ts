import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from './lib/prisma';
import * as fs from 'fs';

async function main() {
  console.log('Using DB URL:', process.env.DATABASE_URL);
  console.log('Backing up Users...');
  const users = await prisma.user.findMany();
  
  console.log('Backing up Subscriptions...');
  const subscriptions = await prisma.subscription.findMany();
  
  console.log('Backing up PaymentTransactions...');
  const payments = await prisma.paymentTransaction.findMany();
  
  console.log('Backing up Sessions...');
  const sessions = await prisma.session.findMany();

  console.log('Backing up WhatsApp configs...');
  const waState = await prisma.whatsAppState.findMany();
  const waAuth = await prisma.whatsAppAuth.findMany();

  const backup = {
    users,
    subscriptions,
    payments,
    sessions,
    waState,
    waAuth
  };

  fs.writeFileSync('db_backup.json', JSON.stringify(backup, null, 2));
  console.log('Backup saved to db_backup.json');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
