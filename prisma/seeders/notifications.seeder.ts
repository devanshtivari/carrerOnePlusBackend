import { NotificationType } from '@prisma/client';

import { SeederContext } from './index';

interface NotificationSeed {
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
}

const studentNotifications: NotificationSeed[] = [
  {
    type: NotificationType.COURSE,
    title: 'New Chapter Available',
    body: 'Unit 3: Advanced React Patterns has been unlocked.',
    link: '/student/courses',
  },
  {
    type: NotificationType.ACHIEVEMENT,
    title: 'Achievement Unlocked!',
    body: 'You completed a 7-day learning streak.',
  },
  {
    type: NotificationType.FEEDBACK,
    title: 'Feedback from Dr. Sarah Miller',
    body: 'Great work on your Redux project. Keep it up!',
    link: '/student/results',
  },
  {
    type: NotificationType.ALERT,
    title: 'Assessment Reminder',
    body: 'Midterm: Data Structures starts in 24 hours.',
    link: '/student/tests',
  },
  {
    type: NotificationType.SYSTEM,
    title: 'System Update',
    body: 'Platform maintenance scheduled for Sunday 2 AM.',
  },
];

const teacherNotifications: NotificationSeed[] = [
  {
    type: NotificationType.ALERT,
    title: 'Class 8 Submissions Pending',
    body: '24 projects from Class 8 need your grading for Python Calculator.',
    link: '/teacher/projects',
  },
  {
    type: NotificationType.FEEDBACK,
    title: 'New Interaction',
    body: 'Aarav Singh has replied to your feedback on their web portfolio.',
  },
  {
    type: NotificationType.SYSTEM,
    title: 'Platform Maintenance',
    body: 'The server will be down for 2 hours on Sunday midnight.',
  },
];

export async function seedNotifications({ prisma }: SeederContext): Promise<void> {
  // Seed every active student/instructor so any test account the QA is signed
  // in as will have notifications to view. Idempotent: old rows are soft-
  // deleted by the Prisma soft-delete extension before we createMany new ones.
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT', isActive: true },
    select: { id: true },
  });
  const teachers = await prisma.user.findMany({
    where: { role: 'INSTRUCTOR', isActive: true },
    select: { id: true },
  });

  for (const user of students) {
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    await prisma.notification.createMany({
      data: studentNotifications.map((n) => ({ ...n, userId: user.id })),
    });
  }
  for (const user of teachers) {
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    await prisma.notification.createMany({
      data: teacherNotifications.map((n) => ({ ...n, userId: user.id })),
    });
  }
}
