import { SubmissionStatus } from '@prisma/client';

import { SeederContext } from './index';

/**
 * Seeds ProjectSubmission rows so the student "My Projects" and teacher
 * "Student Project Details" views render with a mix of statuses.
 *
 * Assigns one submission per (project, student) for a hand-picked list of
 * class-mates. Idempotent — upserts on the (projectId, userId) unique key.
 */

type StudentState = {
  studentEmail: string;
  status: SubmissionStatus;
  marksAwarded?: number;
  daysAgo?: number;
};

const STUDENT_STATES_BY_PROJECT_TITLE: Record<string, StudentState[]> = {
  'Build Your First Bot': [
    { studentEmail: 'alex.johnson@careerone.dev', status: SubmissionStatus.GRADED, marksAwarded: 92, daysAgo: 14 },
    { studentEmail: 'eleanor.pena@careerone.dev', status: SubmissionStatus.GRADED, marksAwarded: 96, daysAgo: 12 },
    { studentEmail: 'jacob.jones@careerone.dev', status: SubmissionStatus.SUBMITTED, daysAgo: 3 },
  ],
  'Solar System Model': [
    { studentEmail: 'alex.johnson@careerone.dev', status: SubmissionStatus.SUBMITTED, daysAgo: 2 },
    { studentEmail: 'cody.fisher@careerone.dev', status: SubmissionStatus.NOT_SUBMITTED },
  ],
  'Line Following Robot': [
    { studentEmail: 'alex.johnson@careerone.dev', status: SubmissionStatus.NOT_SUBMITTED },
  ],
  'Python Robot Controller': [
    { studentEmail: 'alex.johnson@careerone.dev', status: SubmissionStatus.GRADED, marksAwarded: 88, daysAgo: 6 },
    { studentEmail: 'eleanor.pena@careerone.dev', status: SubmissionStatus.SUBMITTED, daysAgo: 1 },
  ],
  'Data Visualization Dashboard': [
    { studentEmail: 'alex.johnson@careerone.dev', status: SubmissionStatus.SUBMITTED, daysAgo: 1 },
  ],
  'Handwriting Recognizer': [
    { studentEmail: 'alex.johnson@careerone.dev', status: SubmissionStatus.NOT_SUBMITTED },
  ],
  'Face Detection System': [
    { studentEmail: 'alex.johnson@careerone.dev', status: SubmissionStatus.GRADED, marksAwarded: 78, daysAgo: 20 },
  ],
  'Object Tracking Pipeline': [
    { studentEmail: 'alex.johnson@careerone.dev', status: SubmissionStatus.REJECTED, daysAgo: 8 },
  ],
};

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export async function seedProjectSubmissions({ prisma }: SeederContext): Promise<void> {
  for (const [projectTitle, states] of Object.entries(STUDENT_STATES_BY_PROJECT_TITLE)) {
    const project = await prisma.project.findFirst({
      where: { title: projectTitle, deletedAt: null },
      select: { id: true },
    });
    if (!project) continue;

    for (const state of states) {
      const user = await prisma.user.findUnique({ where: { email: state.studentEmail } });
      if (!user) continue;

      const isSubmitted = state.status !== SubmissionStatus.NOT_SUBMITTED;
      const submittedAt = isSubmitted ? daysAgo(state.daysAgo ?? 1) : null;
      const gradedAt =
        state.status === SubmissionStatus.GRADED || state.status === SubmissionStatus.REJECTED
          ? daysAgo(Math.max(0, (state.daysAgo ?? 1) - 1))
          : null;

      const payload = {
        status: state.status,
        fileName: isSubmitted ? `${projectTitle.toLowerCase().replace(/\s+/g, '-')}.zip` : null,
        fileSize: isSubmitted ? '2.4 MB' : null,
        fileUrl: isSubmitted ? 'https://example.com/uploads/demo.zip' : null,
        submittedAt,
        gradedAt,
        marksAwarded: state.marksAwarded ?? null,
      };

      await prisma.projectSubmission.upsert({
        where: { projectId_userId: { projectId: project.id, userId: user.id } },
        update: payload,
        create: { projectId: project.id, userId: user.id, ...payload },
      });
    }
  }
}
