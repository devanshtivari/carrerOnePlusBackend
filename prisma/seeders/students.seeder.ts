import { AuthProvider, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { studentsSeedData } from './data/students.data';
import { SeederContext } from './index';

const PLACEHOLDER_PASSWORD = 'Stud!Pass123';

/**
 * Seeds student User rows referenced by classes / enrollments / leaderboards.
 * Idempotent via email upsert.
 */
export async function seedStudents({ prisma }: SeederContext): Promise<void> {
  const passwordHash = await bcrypt.hash(PLACEHOLDER_PASSWORD, 10);
  for (const s of studentsSeedData) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: {
        fullName: s.fullName,
        initials: s.initials,
        totalScore: s.totalScore,
        schoolName: s.schoolName ?? null,
        grade: s.grade ?? null,
        role: UserRole.STUDENT,
        isActive: true,
        isEmailVerified: true,
      },
      create: {
        email: s.email,
        fullName: s.fullName,
        initials: s.initials,
        totalScore: s.totalScore,
        schoolName: s.schoolName ?? null,
        grade: s.grade ?? null,
        role: UserRole.STUDENT,
        authProvider: AuthProvider.LOCAL,
        passwordHash,
        isActive: true,
        isEmailVerified: true,
      },
    });
  }
}
