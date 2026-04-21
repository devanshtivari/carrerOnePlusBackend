import { AuthProvider, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { adminsSeedData } from './data/admins.data';
import { SeederContext } from './index';

const PLACEHOLDER_PASSWORD = 'Admin!Pass123';

export async function seedAdmins({ prisma }: SeederContext): Promise<void> {
  const passwordHash = await bcrypt.hash(PLACEHOLDER_PASSWORD, 10);

  for (const a of adminsSeedData) {
    await prisma.user.upsert({
      where: { email: a.email },
      update: {
        fullName: a.fullName,
        initials: a.initials,
        bio: a.bio ?? null,
        role: UserRole.ADMIN,
        isActive: true,
        isEmailVerified: true,
      },
      create: {
        email: a.email,
        fullName: a.fullName,
        initials: a.initials,
        bio: a.bio ?? null,
        role: UserRole.ADMIN,
        authProvider: AuthProvider.LOCAL,
        passwordHash,
        isActive: true,
        isEmailVerified: true,
      },
    });
  }
}
