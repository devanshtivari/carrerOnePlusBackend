import { AuthProvider, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { instructorsSeedData } from './data/instructors.data';
import { SeederContext } from './index';

/**
 * Idempotently seed instructor users so courses/units/etc. can be linked
 * to a real User row via instructorId. The placeholder password is
 * deterministically hashed once per run; these accounts are intended for
 * dev/local use and are gated behind email verification + active status,
 * matching the auth-service strict guard.
 */
const PLACEHOLDER_PASSWORD = 'Inst!Pass123';

export async function seedInstructors({ prisma }: SeederContext): Promise<void> {
  const passwordHash = await bcrypt.hash(PLACEHOLDER_PASSWORD, 10);

  for (const i of instructorsSeedData) {
    await prisma.user.upsert({
      where: { email: i.email },
      update: {
        fullName: i.fullName,
        initials: i.initials,
        instructorTitle: i.instructorTitle ?? null,
        bio: i.bio ?? null,
        role: UserRole.INSTRUCTOR,
        isActive: true,
        isEmailVerified: true,
      },
      create: {
        email: i.email,
        fullName: i.fullName,
        initials: i.initials,
        instructorTitle: i.instructorTitle ?? null,
        bio: i.bio ?? null,
        role: UserRole.INSTRUCTOR,
        authProvider: AuthProvider.LOCAL,
        passwordHash,
        isActive: true,
        isEmailVerified: true,
      },
    });
  }
}
