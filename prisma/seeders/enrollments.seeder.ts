import { SeederContext } from './index';

interface EnrollmentSeed {
  studentEmail: string;
  courseSlug: string;
  progress: number;
  completed?: boolean;
}

/**
 * Seed enrollments derived from the StudentDashboard sample data.
 * Mocked progress percentages are persisted directly; on first lesson
 * completion the ProgressService will recalculate.
 */
const enrollmentsSeedData: EnrollmentSeed[] = [
  // Student dashboard mocked enrollments — Alex Johnson (current user)
  { studentEmail: 'alex.johnson@careerone.dev', courseSlug: 'fullstack-react-node', progress: 75 },
  { studentEmail: 'alex.johnson@careerone.dev', courseSlug: 'python-data-science', progress: 32 },
  { studentEmail: 'alex.johnson@careerone.dev', courseSlug: 'uiux-design-principles', progress: 90 },
  // Class-mate sample enrollments (so leaderboards have completion data)
  { studentEmail: 'eleanor.pena@careerone.dev', courseSlug: 'fullstack-react-node', progress: 100, completed: true },
  { studentEmail: 'eleanor.pena@careerone.dev', courseSlug: 'python-data-science', progress: 60 },
  { studentEmail: 'jacob.jones@careerone.dev', courseSlug: 'fullstack-react-node', progress: 100, completed: true },
  { studentEmail: 'cody.fisher@careerone.dev', courseSlug: 'uiux-design-principles', progress: 45 },
];

export async function seedEnrollments({ prisma }: SeederContext): Promise<void> {
  const now = new Date();
  for (const e of enrollmentsSeedData) {
    const [user, course] = await Promise.all([
      prisma.user.findUnique({ where: { email: e.studentEmail } }),
      prisma.course.findUnique({ where: { slug: e.courseSlug } }),
    ]);
    if (!user || !course) continue;

    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      update: {
        progress: e.progress,
        completedAt: e.completed ? now : null,
        lastAccessAt: now,
      },
      create: {
        userId: user.id,
        courseId: course.id,
        progress: e.progress,
        completedAt: e.completed ? now : null,
        lastAccessAt: now,
      },
    });
  }
}
