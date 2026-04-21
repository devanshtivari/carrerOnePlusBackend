import { AttemptStatus } from '@prisma/client';

import { SeederContext } from './index';

/**
 * Seeds TestAttempt + AttemptAnswer rows so the Tests results page, the
 * student dashboard counters, and the teacher analytics dashboards render
 * with real scores.
 *
 * Strategy (per test, idempotent — delete+recreate per (testId, userId)):
 *   - One GRADED attempt for the mock current-user (alex.johnson) — perfect
 *     on MCQs, mid-range on TEXT questions.
 *   - One SUBMITTED (awaiting grading) attempt for a class-mate.
 *   - One IN_PROGRESS attempt for another class-mate.
 */

interface AttemptPlan {
  studentEmail: string;
  status: AttemptStatus;
  mcqCorrectness: 'all-correct' | 'most-correct' | 'mixed';
  textMarks: number | null;
  daysAgo?: number;
}

const PLANS_BY_TEST: Record<string, AttemptPlan[]> = {
  'TEST-001': [
    { studentEmail: 'alex.johnson@careerone.dev', status: AttemptStatus.GRADED, mcqCorrectness: 'all-correct', textMarks: 6, daysAgo: 2 },
    { studentEmail: 'eleanor.pena@careerone.dev', status: AttemptStatus.GRADED, mcqCorrectness: 'most-correct', textMarks: 5, daysAgo: 3 },
    { studentEmail: 'jacob.jones@careerone.dev', status: AttemptStatus.SUBMITTED, mcqCorrectness: 'most-correct', textMarks: null, daysAgo: 1 },
    { studentEmail: 'cody.fisher@careerone.dev', status: AttemptStatus.IN_PROGRESS, mcqCorrectness: 'mixed', textMarks: null },
  ],
  'TEST-002': [
    { studentEmail: 'alex.johnson@careerone.dev', status: AttemptStatus.GRADED, mcqCorrectness: 'all-correct', textMarks: null, daysAgo: 4 },
    { studentEmail: 'eleanor.pena@careerone.dev', status: AttemptStatus.GRADED, mcqCorrectness: 'most-correct', textMarks: null, daysAgo: 4 },
  ],
  'TEST-003': [
    { studentEmail: 'alex.johnson@careerone.dev', status: AttemptStatus.IN_PROGRESS, mcqCorrectness: 'mixed', textMarks: null },
  ],
  'TEST-004': [
    { studentEmail: 'alex.johnson@careerone.dev', status: AttemptStatus.GRADED, mcqCorrectness: 'mixed', textMarks: 4, daysAgo: 7 },
  ],
};

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export async function seedTestAttempts({ prisma }: SeederContext): Promise<void> {
  for (const [testCode, plans] of Object.entries(PLANS_BY_TEST)) {
    const test = await prisma.test.findUnique({ where: { code: testCode } });
    if (!test) continue;

    const questions = await prisma.question.findMany({
      where: { testId: test.id, deletedAt: null },
      orderBy: { position: 'asc' },
      include: { options: true },
    });

    for (const plan of plans) {
      const user = await prisma.user.findUnique({ where: { email: plan.studentEmail } });
      if (!user) continue;

      await prisma.testAttempt.deleteMany({ where: { testId: test.id, userId: user.id } });

      const submittedAt =
        plan.status === AttemptStatus.IN_PROGRESS ? null : daysAgo(plan.daysAgo ?? 1);
      const gradedAt = plan.status === AttemptStatus.GRADED ? submittedAt : null;

      let totalAwarded = 0;
      const answerPayloads: {
        questionId: string;
        selectedLabel: string | null;
        textAnswer: string | null;
        awardedMarks: number | null;
        isCorrect: boolean | null;
      }[] = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];

        if (q.type === 'MCQ') {
          const correct = q.options.find((o) => o.isCorrect);
          const incorrect = q.options.find((o) => !o.isCorrect) ?? q.options[0];
          const pickCorrect =
            plan.mcqCorrectness === 'all-correct' ||
            (plan.mcqCorrectness === 'most-correct' && i % 4 !== 0) ||
            (plan.mcqCorrectness === 'mixed' && i % 2 === 0);

          const picked = pickCorrect ? correct : incorrect;
          const isCorrect = picked?.isCorrect ?? false;
          const awarded =
            plan.status === AttemptStatus.GRADED ? (isCorrect ? q.marks : 0) : null;
          if (awarded !== null) totalAwarded += awarded;

          answerPayloads.push({
            questionId: q.id,
            selectedLabel: picked?.label ?? null,
            textAnswer: null,
            awardedMarks: awarded,
            isCorrect: plan.status === AttemptStatus.GRADED ? isCorrect : null,
          });
        } else {
          const awarded =
            plan.status === AttemptStatus.GRADED ? plan.textMarks ?? Math.floor(q.marks * 0.7) : null;
          if (awarded !== null) totalAwarded += awarded;

          answerPayloads.push({
            questionId: q.id,
            selectedLabel: null,
            textAnswer:
              plan.status === AttemptStatus.IN_PROGRESS
                ? null
                : 'Sample answer submitted by the student for demo purposes.',
            awardedMarks: awarded,
            isCorrect: null,
          });
        }
      }

      const attempt = await prisma.testAttempt.create({
        data: {
          testId: test.id,
          userId: user.id,
          status: plan.status,
          startedAt: daysAgo((plan.daysAgo ?? 1) + 1),
          submittedAt,
          gradedAt,
          score: plan.status === AttemptStatus.GRADED ? totalAwarded : null,
          maxScore: plan.status === AttemptStatus.GRADED ? test.totalMarks : null,
        },
      });

      if (answerPayloads.length > 0) {
        await prisma.attemptAnswer.createMany({
          data: answerPayloads.map((a) => ({ ...a, attemptId: attempt.id })),
        });
      }
    }
  }
}
