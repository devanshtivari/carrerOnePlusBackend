import { SubmissionStatus } from '@prisma/client';

import { SeederContext } from './index';

/**
 * Seeds AssignmentSubmission rows for each seeded assignment so the teacher's
 * "Assignments" dashboard shows real submission counts and the student's
 * "My Assignments" tab shows real grades/feedback.
 *
 * Logic:
 *  - For every assignment, split the class roster roughly along the
 *    assignment's own `submittedCount` ratio:
 *      submitted   → SUBMITTED (no grade yet)  — first N
 *      graded      → GRADED (with grade + feedback)
 *      remaining   → NOT_SUBMITTED
 *
 * Idempotent — upserts on (assignmentId, userId).
 */

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const GRADE_TABLE = ['A+', 'A', 'A-', 'B+', 'B'];
const MARK_TABLE = [98, 92, 88, 84, 80];

export async function seedAssignmentSubmissions({ prisma }: SeederContext): Promise<void> {
  const assignments = await prisma.assignment.findMany({
    where: { deletedAt: null, classId: { not: null } },
    select: {
      id: true,
      classId: true,
      submittedCount: true,
      totalStudents: true,
    },
  });

  for (const assignment of assignments) {
    if (!assignment.classId) continue;

    const memberships = await prisma.classMembership.findMany({
      where: { classId: assignment.classId, role: 'STUDENT', deletedAt: null },
      select: { userId: true },
      orderBy: { joinedAt: 'asc' },
    });

    const students = memberships.map((m) => m.userId);
    if (students.length === 0) continue;

    const submittedSlice = Math.min(assignment.submittedCount, students.length);
    // Split: first third graded, next third submitted (awaiting grade), rest not submitted.
    const gradedCount = Math.floor(submittedSlice / 2);
    const submittedOnlyCount = submittedSlice - gradedCount;

    for (let i = 0; i < students.length; i++) {
      const userId = students[i];
      let payload: {
        status: SubmissionStatus;
        submittedAt: Date | null;
        gradeLabel: string | null;
        marksAwarded: number | null;
        totalMarks: number | null;
        feedback: string | null;
        fileUrl: string | null;
      };

      if (i < gradedCount) {
        const idx = i % GRADE_TABLE.length;
        payload = {
          status: SubmissionStatus.GRADED,
          submittedAt: daysAgo(5 + (i % 4)),
          gradeLabel: GRADE_TABLE[idx],
          marksAwarded: MARK_TABLE[idx],
          totalMarks: 100,
          feedback:
            'Good effort! Strong fundamentals — clean up variable naming and add a short write-up next time.',
          fileUrl: 'https://example.com/uploads/demo.pdf',
        };
      } else if (i < gradedCount + submittedOnlyCount) {
        payload = {
          status: SubmissionStatus.SUBMITTED,
          submittedAt: daysAgo(1 + (i % 3)),
          gradeLabel: null,
          marksAwarded: null,
          totalMarks: 100,
          feedback: null,
          fileUrl: 'https://example.com/uploads/demo.pdf',
        };
      } else {
        payload = {
          status: SubmissionStatus.NOT_SUBMITTED,
          submittedAt: null,
          gradeLabel: null,
          marksAwarded: null,
          totalMarks: 100,
          feedback: null,
          fileUrl: null,
        };
      }

      await prisma.assignmentSubmission.upsert({
        where: { assignmentId_userId: { assignmentId: assignment.id, userId } },
        update: payload,
        create: { assignmentId: assignment.id, userId, ...payload },
      });
    }
  }
}
