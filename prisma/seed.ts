/**
 * Prisma seed entry point.
 *
 * Runs every registered seeder in order. Each seeder MUST be idempotent
 * (use upsert / create-if-missing) so this script can be re-run safely.
 *
 * Usage:
 *   npm run db:seed         # invokes `prisma db seed`
 *   prisma migrate reset    # also runs this automatically
 */
import { PrismaClient } from '@prisma/client';
import { seeders, SeederContext } from './seeders';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const startedAt = Date.now();
  // eslint-disable-next-line no-console
  console.log(`\n🌱  Seeding database (${seeders.length} seeders)\n`);

  const ctx: SeederContext = { prisma };

  for (const seeder of seeders) {
    const seederStartedAt = Date.now();
    try {
      // eslint-disable-next-line no-console
      console.log(`  → ${seeder.name}`);
      await seeder.run(ctx);
      // eslint-disable-next-line no-console
      console.log(`    ✓ ${seeder.name} (${Date.now() - seederStartedAt}ms)`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`    ✗ ${seeder.name} failed:`, err);
      throw err;
    }
  }

  // eslint-disable-next-line no-console
  console.log(`\n✅  Seed complete in ${Date.now() - startedAt}ms\n`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
