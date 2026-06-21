/**
 * One-time migration: hash all existing plaintext passwords.
 * Run once after deployment: npx tsx prisma/hash-passwords.ts
 *
 * Safe: only hashes passwords that aren't already bcrypt-hashed
 * (bcrypt hashes always start with "$2a$" or "$2b$")
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashExistingPasswords() {
  console.log('🔍 Checking existing user passwords...');

  const users = await prisma.user.findMany();
  let updated = 0;
  let skipped = 0;

  for (const user of users) {
    // Bcrypt hashes always start with $2a$ or $2b$
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      skipped++;
      continue;
    }

    const hashed = await bcrypt.hash(user.password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });
    updated++;
    console.log(`  ✅ ${user.email} → hashed`);
  }

  console.log(`\n🎉 Done! ${updated} passwords hashed, ${skipped} already hashed, ${users.length} total.`);
}

hashExistingPasswords()
  .catch((e) => {
    console.error('❌', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
