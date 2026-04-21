import { SeederContext } from './index';

interface FeedbackSeed {
  studentEmail: string;
  instructorEmail: string;
  body: string;
  sectionLabel?: string;
  gradeLabel?: string;
  contextType?: string;
}

const feedbackSeedData: FeedbackSeed[] = [
  {
    studentEmail: 'alex.johnson@careerone.dev',
    instructorEmail: 'sarah.miller@careerone.dev',
    body: 'Excellent use of Redux Toolkit in your last project. The state management logic is very clean!',
    sectionLabel: 'Web Architecture',
    gradeLabel: 'Grade: A+ (96/100)',
    contextType: 'PROJECT',
  },
  {
    studentEmail: 'eleanor.pena@careerone.dev',
    instructorEmail: 'sarah.miller@careerone.dev',
    body: 'Outstanding analysis on your sorting algorithm benchmark. The methodology was rigorous.',
    sectionLabel: 'DSA',
    gradeLabel: 'Grade: A+ (98/100)',
    contextType: 'ASSIGNMENT',
  },
  {
    studentEmail: 'jacob.jones@careerone.dev',
    instructorEmail: 'david.chen@careerone.dev',
    body: 'Good logic in your Python calculator, could improve error handling.',
    sectionLabel: 'Python',
    gradeLabel: 'Grade: A (88/100)',
    contextType: 'ASSIGNMENT',
  },
];

export async function seedFeedback({ prisma }: SeederContext): Promise<void> {
  for (const data of feedbackSeedData) {
    const [student, instructor] = await Promise.all([
      prisma.user.findUnique({ where: { email: data.studentEmail } }),
      prisma.user.findUnique({ where: { email: data.instructorEmail } }),
    ]);
    if (!student || !instructor) continue;

    const existing = await prisma.feedback.findFirst({
      where: { studentId: student.id, instructorId: instructor.id, body: data.body },
    });
    if (existing) continue;

    await prisma.feedback.create({
      data: {
        studentId: student.id,
        instructorId: instructor.id,
        body: data.body,
        sectionLabel: data.sectionLabel ?? null,
        gradeLabel: data.gradeLabel ?? null,
        contextType: data.contextType ?? null,
      },
    });
  }
}
