import { ClassMembershipRole } from '@prisma/client';

import { classesSeedData } from './data/classes.data';
import { SeederContext } from './index';

export async function seedClasses({ prisma }: SeederContext): Promise<void> {
  for (const cls of classesSeedData) {
    const created = await prisma.class.upsert({
      where: { code: cls.code },
      update: {
        name: cls.name,
        grade: cls.grade ?? null,
        section: cls.section ?? null,
        schoolName: cls.schoolName ?? null,
        description: cls.description ?? null,
      },
      create: {
        code: cls.code,
        name: cls.name,
        grade: cls.grade ?? null,
        section: cls.section ?? null,
        schoolName: cls.schoolName ?? null,
        description: cls.description ?? null,
      },
    });

    const teacherEmails = cls.teachers ?? [];
    for (const email of teacherEmails) {
      const teacher = await prisma.user.findUnique({ where: { email } });
      if (!teacher) continue;
      await upsertMembership(
        prisma,
        created.id,
        teacher.id,
        ClassMembershipRole.TEACHER,
      );
    }

    for (const member of cls.members) {
      const user = await prisma.user.findUnique({ where: { email: member.studentEmail } });
      if (!user) continue;
      await upsertMembership(
        prisma,
        created.id,
        user.id,
        member.role ?? ClassMembershipRole.STUDENT,
      );
    }
  }
}

async function upsertMembership(
  prisma: SeederContext['prisma'],
  classId: string,
  userId: string,
  role: ClassMembershipRole,
): Promise<void> {
  const existing = await prisma.classMembership.findFirst({
    where: { classId, userId, role },
  });
  if (existing) return;
  await prisma.classMembership.create({
    data: { classId, userId, role },
  });
}
