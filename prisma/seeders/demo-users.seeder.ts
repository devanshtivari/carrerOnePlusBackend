/**
 * Demo-user backfill — makes `alex.johnson@careerone.dev` (primary demo student)
 * and `eleanor.pena@careerone.dev` (high-performer demo student) feature-complete
 * across every module in the platform, so every screen on the frontend renders
 * with known, rich data.
 *
 * This seeder runs AFTER the broad seeders (test-attempts, project-submissions,
 * assignment-submissions, results) but BEFORE `leaderboard` so rank recomputation
 * picks up the enriched enrolment + score data.
 *
 * Everything is idempotent — profile fields are updated in place, scores and
 * growth snapshots are upserted on their unique keys, and per-entity child
 * rows (test attempts, submissions, notifications, feedback) are refreshed
 * via delete-then-create scoped to each demo user.
 */
import {
  AssignmentStatus,
  AttemptStatus,
  NotificationType,
  SubmissionStatus,
  TrendDirection,
} from '@prisma/client';

import { SeederContext } from './index';

type DemoHandle = 'alex' | 'eleanor';

interface DemoUserSpec {
  handle: DemoHandle;
  email: string;
  /** Patch written on top of the existing User row. */
  profile: {
    mobile: string;
    age: number;
    rollNo: string;
    avatarUrl: string;
    bannerUrl: string;
    bio: string;
    attendance: number;
    percentile: number;
    rank: number;
    totalScore: number;
    instructorTitle?: never;
  };
  enrolmentProgress: Record<string, { progress: number; completed?: boolean }>;
  subjectScores: Array<{
    subjectLabel: string;
    score: number;
    gradeLabel: string;
    trend: TrendDirection;
    trendValue: string;
  }>;
  growthSnapshots: Array<{ monthKey: string; monthLabel: string; score: number }>;
  notifications: Array<{
    type: NotificationType;
    title: string;
    body: string;
    link?: string;
    readAgoDays?: number;
  }>;
  feedback: Array<{
    instructorEmail: string;
    sectionLabel: string;
    body: string;
    gradeLabel?: string;
    contextType?: 'PROJECT' | 'ASSIGNMENT' | 'TEST';
  }>;
  /** Per-test attempt plan (by Test.code). */
  attempts: Record<
    string,
    {
      status: AttemptStatus;
      mcqCorrectnessRatio: number;
      textMarksRatio: number;
      daysAgo?: number;
    }
  >;
  /** Per-project plan keyed by Project.title. */
  projectPlans: Record<
    string,
    { status: SubmissionStatus; marksAwarded?: number; daysAgo?: number }
  >;
  /** Per-assignment plan keyed by Assignment.title. */
  assignmentPlans: Record<
    string,
    {
      status: SubmissionStatus;
      gradeLabel?: string;
      marksAwarded?: number;
      feedback?: string;
      daysAgo?: number;
    }
  >;
}

const DEMO_USERS: DemoUserSpec[] = [
  {
    handle: 'alex',
    email: 'alex.johnson@careerone.dev',
    profile: {
      mobile: '+91-9000000055',
      age: 15,
      rollNo: '10A-05',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
      bannerUrl:
        'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1200&auto=format&fit=crop',
      bio: 'Grade 10 student exploring full-stack web dev and applied ML. Loves football and lo-fi beats.',
      attendance: 94.5,
      percentile: 88.2,
      rank: 5,
      totalScore: 1250,
    },
    enrolmentProgress: {
      'fullstack-react-node': { progress: 75 },
      'python-data-science': { progress: 32 },
      'uiux-design-principles': { progress: 90 },
      'ai-and-machine-learning': { progress: 18 },
      'introduction-to-robotics': { progress: 5 },
    },
    subjectScores: [
      { subjectLabel: 'Data Structures & Algorithms', score: 96, gradeLabel: 'A+', trend: TrendDirection.UP,     trendValue: '+4' },
      { subjectLabel: 'Python Fundamentals',         score: 91, gradeLabel: 'A',  trend: TrendDirection.UP,     trendValue: '+6' },
      { subjectLabel: 'Web Development (HTML/CSS)',  score: 88, gradeLabel: 'A',  trend: TrendDirection.STABLE, trendValue: '0' },
      { subjectLabel: 'AI & Robotics Basics',        score: 82, gradeLabel: 'B+', trend: TrendDirection.UP,     trendValue: '+8' },
      { subjectLabel: 'Database Management',         score: 76, gradeLabel: 'B',  trend: TrendDirection.DOWN,   trendValue: '-3' },
      { subjectLabel: 'Mathematics for CS',          score: 85, gradeLabel: 'A-', trend: TrendDirection.UP,     trendValue: '+2' },
    ],
    growthSnapshots: [
      { monthKey: '2025-05', monthLabel: 'May', score: 58 },
      { monthKey: '2025-06', monthLabel: 'Jun', score: 62 },
      { monthKey: '2025-07', monthLabel: 'Jul', score: 64 },
      { monthKey: '2025-08', monthLabel: 'Aug', score: 66 },
      { monthKey: '2025-09', monthLabel: 'Sep', score: 68 },
      { monthKey: '2025-10', monthLabel: 'Oct', score: 72 },
      { monthKey: '2025-11', monthLabel: 'Nov', score: 74 },
      { monthKey: '2025-12', monthLabel: 'Dec', score: 78 },
      { monthKey: '2026-01', monthLabel: 'Jan', score: 83 },
      { monthKey: '2026-02', monthLabel: 'Feb', score: 86 },
      { monthKey: '2026-03', monthLabel: 'Mar', score: 88 },
      { monthKey: '2026-04', monthLabel: 'Apr', score: 92 },
    ],
    notifications: [
      { type: NotificationType.COURSE,      title: 'New lesson unlocked',       body: '"Transfer Learning" is now available in AI & ML — Unit 3.', link: '/student/courses', readAgoDays: 0 },
      { type: NotificationType.ACHIEVEMENT, title: '7-day learning streak',      body: 'You\'ve logged in and completed a lesson every day this week. Keep it going!' },
      { type: NotificationType.FEEDBACK,    title: 'Dr. Sarah Miller gave feedback', body: '"Great use of Redux Toolkit in your last project."', link: '/student/results' },
      { type: NotificationType.ALERT,       title: 'Midterm reminder',           body: 'Midterm: Data Structures & Algorithms starts in 24 hours.', link: '/student/tests', readAgoDays: 0 },
      { type: NotificationType.SYSTEM,      title: 'Maintenance window',        body: 'Platform will be offline for 30 minutes this Sunday at 02:00.', readAgoDays: 2 },
      { type: NotificationType.COURSE,      title: 'Assignment graded',         body: 'Your Algorithms Worksheet has been graded — Grade A-.', link: '/student/assignments', readAgoDays: 1 },
    ],
    feedback: [
      {
        instructorEmail: 'sarah.miller@careerone.dev',
        sectionLabel: 'Web Architecture',
        body: 'Excellent use of Redux Toolkit in your last project. The state management logic is very clean!',
        gradeLabel: 'Grade: A+ (96/100)',
        contextType: 'PROJECT',
      },
      {
        instructorEmail: 'david.chen@careerone.dev',
        sectionLabel: 'Python',
        body: 'Your list-comprehension solution was elegant. Try to add docstrings next time.',
        gradeLabel: 'Grade: A (91/100)',
        contextType: 'ASSIGNMENT',
      },
      {
        instructorEmail: 'alex.rivera@careerone.dev',
        sectionLabel: 'Midterm DSA',
        body: 'Strong on MCQs, but your written answer on Merge Sort missed the base-case discussion.',
        gradeLabel: 'Grade: B+ (83/100)',
        contextType: 'TEST',
      },
    ],
    attempts: {
      'TEST-001': { status: AttemptStatus.GRADED,       mcqCorrectnessRatio: 1.0, textMarksRatio: 0.85, daysAgo: 2 },
      'TEST-002': { status: AttemptStatus.GRADED,       mcqCorrectnessRatio: 1.0, textMarksRatio: 1.0,  daysAgo: 4 },
      'TEST-003': { status: AttemptStatus.IN_PROGRESS,  mcqCorrectnessRatio: 0.5, textMarksRatio: 0 },
      'TEST-004': { status: AttemptStatus.GRADED,       mcqCorrectnessRatio: 0.7, textMarksRatio: 0.7,  daysAgo: 7 },
    },
    projectPlans: {
      'Build Your First Bot':          { status: SubmissionStatus.GRADED,         marksAwarded: 92, daysAgo: 14 },
      'Solar System Model':            { status: SubmissionStatus.SUBMITTED,                       daysAgo: 2  },
      'Line Following Robot':          { status: SubmissionStatus.NOT_SUBMITTED                                },
      'Python Robot Controller':       { status: SubmissionStatus.GRADED,         marksAwarded: 88, daysAgo: 6  },
      'Data Visualization Dashboard':  { status: SubmissionStatus.SUBMITTED,                       daysAgo: 1  },
      'Handwriting Recognizer':        { status: SubmissionStatus.NOT_SUBMITTED                                },
      'Face Detection System':         { status: SubmissionStatus.GRADED,         marksAwarded: 78, daysAgo: 20 },
      'Object Tracking Pipeline':      { status: SubmissionStatus.REJECTED,                        daysAgo: 8  },
      'Q-Learning Grid World':         { status: SubmissionStatus.SUBMITTED,                       daysAgo: 3  },
      'Capstone: Autonomous Agent':    { status: SubmissionStatus.NOT_SUBMITTED                                },
    },
    assignmentPlans: {
      'Intro to HTML — My First Page': { status: SubmissionStatus.SUBMITTED,                                   daysAgo: 2 },
      'Typing Speed Challenge':        { status: SubmissionStatus.GRADED, gradeLabel: 'A',  marksAwarded: 92, feedback: 'Consistent 62 WPM — excellent.',           daysAgo: 10 },
      'Scratch Animated Story':        { status: SubmissionStatus.SUBMITTED,                                   daysAgo: 3 },
      'Algorithms Worksheet':          { status: SubmissionStatus.GRADED, gradeLabel: 'A-', marksAwarded: 85, feedback: 'Good complexity analysis; explain trade-offs next time.', daysAgo: 6 },
      'Python Basics Quiz Recap':      { status: SubmissionStatus.NOT_SUBMITTED                                           },
    },
  },

  {
    handle: 'eleanor',
    email: 'eleanor.pena@careerone.dev',
    profile: {
      mobile: '+91-9000000001',
      age: 15,
      rollNo: '10A-01',
      avatarUrl: 'https://i.pravatar.cc/150?img=47',
      bannerUrl:
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop',
      bio: 'Grade 10 class topper. Obsessed with algorithms and classical literature in equal measure.',
      attendance: 98.4,
      percentile: 96.5,
      rank: 1,
      totalScore: 2450,
    },
    enrolmentProgress: {
      'fullstack-react-node':    { progress: 100, completed: true },
      'python-data-science':     { progress: 82 },
      'ai-and-machine-learning': { progress: 64 },
      'introduction-to-robotics':{ progress: 40 },
      'uiux-design-principles':  { progress: 100, completed: true },
    },
    subjectScores: [
      { subjectLabel: 'Data Structures & Algorithms', score: 98, gradeLabel: 'A+', trend: TrendDirection.UP,     trendValue: '+2' },
      { subjectLabel: 'Python Fundamentals',         score: 96, gradeLabel: 'A+', trend: TrendDirection.UP,     trendValue: '+3' },
      { subjectLabel: 'Web Development (HTML/CSS)',  score: 94, gradeLabel: 'A',  trend: TrendDirection.STABLE, trendValue: '0' },
      { subjectLabel: 'AI & Robotics Basics',        score: 91, gradeLabel: 'A',  trend: TrendDirection.UP,     trendValue: '+5' },
      { subjectLabel: 'Database Management',         score: 89, gradeLabel: 'A',  trend: TrendDirection.UP,     trendValue: '+4' },
      { subjectLabel: 'Mathematics for CS',          score: 95, gradeLabel: 'A+', trend: TrendDirection.UP,     trendValue: '+1' },
    ],
    growthSnapshots: [
      { monthKey: '2025-05', monthLabel: 'May', score: 80 },
      { monthKey: '2025-06', monthLabel: 'Jun', score: 82 },
      { monthKey: '2025-07', monthLabel: 'Jul', score: 83 },
      { monthKey: '2025-08', monthLabel: 'Aug', score: 85 },
      { monthKey: '2025-09', monthLabel: 'Sep', score: 87 },
      { monthKey: '2025-10', monthLabel: 'Oct', score: 89 },
      { monthKey: '2025-11', monthLabel: 'Nov', score: 90 },
      { monthKey: '2025-12', monthLabel: 'Dec', score: 92 },
      { monthKey: '2026-01', monthLabel: 'Jan', score: 93 },
      { monthKey: '2026-02', monthLabel: 'Feb', score: 94 },
      { monthKey: '2026-03', monthLabel: 'Mar', score: 96 },
      { monthKey: '2026-04', monthLabel: 'Apr', score: 97 },
    ],
    notifications: [
      { type: NotificationType.COURSE,      title: 'Course completed!',        body: 'You finished "Full-Stack Web Development". Certificate ready.', link: '/student/results' },
      { type: NotificationType.ACHIEVEMENT, title: 'Class Rank #1',            body: 'You\'re currently the #1 student in Grade 10-A.' },
      { type: NotificationType.FEEDBACK,    title: 'Feedback from Dr. Miller', body: 'Outstanding sorting-algorithm write-up. Consider submitting to the school magazine.' },
      { type: NotificationType.ALERT,       title: 'Python quiz coming up',    body: 'Quiz: Python Fundamentals scheduled for Friday 14:00.' },
      { type: NotificationType.SYSTEM,      title: 'Welcome back!',            body: 'Your last active session was 2 days ago.' },
    ],
    feedback: [
      {
        instructorEmail: 'sarah.miller@careerone.dev',
        sectionLabel: 'DSA',
        body: 'Outstanding analysis on your sorting algorithm benchmark. The methodology was rigorous.',
        gradeLabel: 'Grade: A+ (98/100)',
        contextType: 'ASSIGNMENT',
      },
      {
        instructorEmail: 'maya.patel@careerone.dev',
        sectionLabel: 'Pandas Lab',
        body: 'Clean, idiomatic Pandas. Next step: try profiling with %timeit to measure impact.',
        gradeLabel: 'Grade: A+ (96/100)',
        contextType: 'PROJECT',
      },
      {
        instructorEmail: 'alex.rivera@careerone.dev',
        sectionLabel: 'React Project',
        body: 'Component composition was exemplary. Consider adopting React Query for server state.',
        gradeLabel: 'Grade: A (95/100)',
        contextType: 'PROJECT',
      },
    ],
    attempts: {
      'TEST-001': { status: AttemptStatus.GRADED,    mcqCorrectnessRatio: 0.85, textMarksRatio: 0.9, daysAgo: 3 },
      'TEST-002': { status: AttemptStatus.GRADED,    mcqCorrectnessRatio: 1.0,  textMarksRatio: 1.0, daysAgo: 4 },
      'TEST-003': { status: AttemptStatus.SUBMITTED, mcqCorrectnessRatio: 1.0,  textMarksRatio: 0,   daysAgo: 1 },
      'TEST-004': { status: AttemptStatus.GRADED,    mcqCorrectnessRatio: 0.9,  textMarksRatio: 0.9, daysAgo: 9 },
    },
    projectPlans: {
      'Build Your First Bot':          { status: SubmissionStatus.GRADED,    marksAwarded: 96, daysAgo: 12 },
      'Solar System Model':            { status: SubmissionStatus.GRADED,    marksAwarded: 94, daysAgo: 10 },
      'Line Following Robot':          { status: SubmissionStatus.SUBMITTED,                  daysAgo: 1  },
      'Python Robot Controller':       { status: SubmissionStatus.GRADED,    marksAwarded: 92, daysAgo: 8  },
      'Data Visualization Dashboard':  { status: SubmissionStatus.GRADED,    marksAwarded: 90, daysAgo: 6  },
      'Handwriting Recognizer':        { status: SubmissionStatus.SUBMITTED,                  daysAgo: 2  },
      'Face Detection System':         { status: SubmissionStatus.GRADED,    marksAwarded: 89, daysAgo: 15 },
      'Object Tracking Pipeline':      { status: SubmissionStatus.SUBMITTED,                  daysAgo: 1  },
      'Q-Learning Grid World':         { status: SubmissionStatus.NOT_SUBMITTED                           },
      'Capstone: Autonomous Agent':    { status: SubmissionStatus.NOT_SUBMITTED                           },
    },
    assignmentPlans: {
      'Intro to HTML — My First Page': { status: SubmissionStatus.GRADED, gradeLabel: 'A+', marksAwarded: 98, feedback: 'Beautiful semantic markup and hero section — top of the class.',   daysAgo: 5 },
      'Typing Speed Challenge':        { status: SubmissionStatus.GRADED, gradeLabel: 'A+', marksAwarded: 99, feedback: '74 WPM average — record for the class.',                          daysAgo: 11 },
      'Scratch Animated Story':        { status: SubmissionStatus.GRADED, gradeLabel: 'A',  marksAwarded: 92, feedback: 'Charming storyline; look into parallax backgrounds next time.',   daysAgo: 4 },
      'Algorithms Worksheet':          { status: SubmissionStatus.GRADED, gradeLabel: 'A+', marksAwarded: 98, feedback: 'All five problems solved with optimal complexity.',               daysAgo: 3 },
      'Python Basics Quiz Recap':      { status: SubmissionStatus.SUBMITTED,                                                                                                                daysAgo: 1 },
    },
  },
];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export async function seedDemoUsers({ prisma }: SeederContext): Promise<void> {
  for (const spec of DEMO_USERS) {
    const user = await prisma.user.findUnique({ where: { email: spec.email } });
    if (!user) {
      // eslint-disable-next-line no-console
      console.warn(`  ⚠️  demo-users: user ${spec.email} not found, skipping`);
      continue;
    }

    await enrichProfile(prisma, user.id, spec);
    await upsertEnrollments(prisma, user.id, spec);
    await upsertLessonCompletions(prisma, user.id, spec);
    await upsertSubjectScores(prisma, user.id, spec);
    await upsertGrowthSnapshots(prisma, user.id, spec);
    await upsertNotifications(prisma, user.id, spec);
    await upsertFeedback(prisma, user.id, spec);
    await rebuildTestAttempts(prisma, user.id, spec);
    await upsertProjectSubmissions(prisma, user.id, spec);
    await upsertAssignmentSubmissions(prisma, user.id, spec);
  }
}

async function enrichProfile(
  prisma: SeederContext['prisma'],
  userId: string,
  spec: DemoUserSpec,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      mobile: spec.profile.mobile,
      age: spec.profile.age,
      rollNo: spec.profile.rollNo,
      avatarUrl: spec.profile.avatarUrl,
      bannerUrl: spec.profile.bannerUrl,
      bio: spec.profile.bio,
      attendance: spec.profile.attendance,
      percentile: spec.profile.percentile,
      rank: spec.profile.rank,
      totalScore: spec.profile.totalScore,
      lastLoginAt: new Date(),
    },
  });
}

async function upsertEnrollments(
  prisma: SeederContext['prisma'],
  userId: string,
  spec: DemoUserSpec,
): Promise<void> {
  const slugs = Object.keys(spec.enrolmentProgress);
  const courses = await prisma.course.findMany({
    where: { slug: { in: slugs }, deletedAt: null },
    select: { id: true, slug: true },
  });
  const now = new Date();
  for (const c of courses) {
    const plan = spec.enrolmentProgress[c.slug];
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId: c.id } },
      update: {
        progress: plan.progress,
        completedAt: plan.completed ? now : null,
        lastAccessAt: now,
        deletedAt: null,
      },
      create: {
        userId,
        courseId: c.id,
        progress: plan.progress,
        completedAt: plan.completed ? now : null,
        lastAccessAt: now,
      },
    });
  }
}

async function upsertLessonCompletions(
  prisma: SeederContext['prisma'],
  userId: string,
  spec: DemoUserSpec,
): Promise<void> {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId, deletedAt: null },
    select: { courseId: true, progress: true },
  });

  for (const enrolment of enrollments) {
    const lessons = await prisma.lesson.findMany({
      where: {
        deletedAt: null,
        chapter: { unit: { courseId: enrolment.courseId, deletedAt: null }, deletedAt: null },
      },
      select: {
        id: true,
        position: true,
        chapter: { select: { position: true, unit: { select: { moduleNumber: true } } } },
      },
    });
    if (lessons.length === 0) continue;
    lessons.sort((a, b) => {
      const unitDiff = a.chapter.unit.moduleNumber - b.chapter.unit.moduleNumber;
      if (unitDiff !== 0) return unitDiff;
      const chapterDiff = a.chapter.position - b.chapter.position;
      if (chapterDiff !== 0) return chapterDiff;
      return a.position - b.position;
    });

    const completedCount = Math.round((enrolment.progress / 100) * lessons.length);
    const completedLessons = lessons.slice(0, completedCount);

    for (let i = 0; i < completedLessons.length; i++) {
      const lesson = completedLessons[i];
      // Spread completions across the last 14 days so the "streak" card lights up.
      const completedAt = daysAgo(Math.floor(i / Math.max(1, completedLessons.length / 14)));
      await prisma.lessonCompletion.upsert({
        where: { userId_lessonId: { userId, lessonId: lesson.id } },
        update: { completedAt },
        create: { userId, lessonId: lesson.id, completedAt },
      });
    }

    // Ensure at least one completion landed today so the streak starts at ≥1.
    const todayLesson = completedLessons[0];
    if (todayLesson) {
      await prisma.lessonCompletion.update({
        where: { userId_lessonId: { userId, lessonId: todayLesson.id } },
        data: { completedAt: new Date() },
      });
    }
  }
  void spec;
}

async function upsertSubjectScores(
  prisma: SeederContext['prisma'],
  userId: string,
  spec: DemoUserSpec,
): Promise<void> {
  for (const s of spec.subjectScores) {
    await prisma.subjectScore.upsert({
      where: { userId_subjectLabel: { userId, subjectLabel: s.subjectLabel } },
      update: {
        score: s.score,
        maxScore: 100,
        gradeLabel: s.gradeLabel,
        trend: s.trend,
        trendValue: s.trendValue,
        recordedAt: new Date(),
        deletedAt: null,
      },
      create: {
        userId,
        subjectLabel: s.subjectLabel,
        score: s.score,
        maxScore: 100,
        gradeLabel: s.gradeLabel,
        trend: s.trend,
        trendValue: s.trendValue,
      },
    });
  }
}

async function upsertGrowthSnapshots(
  prisma: SeederContext['prisma'],
  userId: string,
  spec: DemoUserSpec,
): Promise<void> {
  for (const g of spec.growthSnapshots) {
    await prisma.growthSnapshot.upsert({
      where: { userId_monthKey: { userId, monthKey: g.monthKey } },
      update: { monthLabel: g.monthLabel, score: g.score, recordedAt: new Date() },
      create: { userId, monthKey: g.monthKey, monthLabel: g.monthLabel, score: g.score },
    });
  }
}

async function upsertNotifications(
  prisma: SeederContext['prisma'],
  userId: string,
  spec: DemoUserSpec,
): Promise<void> {
  await prisma.notification.deleteMany({ where: { userId } });
  if (spec.notifications.length === 0) return;

  await prisma.notification.createMany({
    data: spec.notifications.map((n) => ({
      userId,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link ?? null,
      readAt: n.readAgoDays != null ? daysAgo(n.readAgoDays) : null,
    })),
  });
}

async function upsertFeedback(
  prisma: SeederContext['prisma'],
  userId: string,
  spec: DemoUserSpec,
): Promise<void> {
  await prisma.feedback.deleteMany({ where: { studentId: userId } });
  for (const f of spec.feedback) {
    const instructor = await prisma.user.findUnique({
      where: { email: f.instructorEmail },
      select: { id: true },
    });
    if (!instructor) continue;
    await prisma.feedback.create({
      data: {
        studentId: userId,
        instructorId: instructor.id,
        sectionLabel: f.sectionLabel,
        body: f.body,
        gradeLabel: f.gradeLabel ?? null,
        contextType: f.contextType ?? null,
      },
    });
  }
}

async function rebuildTestAttempts(
  prisma: SeederContext['prisma'],
  userId: string,
  spec: DemoUserSpec,
): Promise<void> {
  for (const [testCode, plan] of Object.entries(spec.attempts)) {
    const test = await prisma.test.findUnique({ where: { code: testCode } });
    if (!test) continue;

    const questions = await prisma.question.findMany({
      where: { testId: test.id, deletedAt: null },
      orderBy: { position: 'asc' },
      include: { options: true },
    });

    await prisma.testAttempt.deleteMany({ where: { testId: test.id, userId } });

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

    const mcqQuestions = questions.filter((q) => q.type === 'MCQ');
    const targetCorrect = Math.round(mcqQuestions.length * plan.mcqCorrectnessRatio);

    let mcqIndex = 0;
    for (const q of questions) {
      if (q.type === 'MCQ') {
        const correct = q.options.find((o) => o.isCorrect);
        const incorrect = q.options.find((o) => !o.isCorrect) ?? q.options[0];
        const pickCorrect = mcqIndex < targetCorrect;
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
        mcqIndex += 1;
      } else {
        const awarded =
          plan.status === AttemptStatus.GRADED
            ? Math.round(q.marks * plan.textMarksRatio)
            : null;
        if (awarded !== null) totalAwarded += awarded;
        answerPayloads.push({
          questionId: q.id,
          selectedLabel: null,
          textAnswer:
            plan.status === AttemptStatus.IN_PROGRESS
              ? null
              : 'Demo answer submitted by this student for review.',
          awardedMarks: awarded,
          isCorrect: null,
        });
      }
    }

    const attempt = await prisma.testAttempt.create({
      data: {
        testId: test.id,
        userId,
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

async function upsertProjectSubmissions(
  prisma: SeederContext['prisma'],
  userId: string,
  spec: DemoUserSpec,
): Promise<void> {
  for (const [projectTitle, plan] of Object.entries(spec.projectPlans)) {
    const project = await prisma.project.findFirst({
      where: { title: projectTitle, deletedAt: null },
      select: { id: true },
    });
    if (!project) continue;

    const isSubmitted = plan.status !== SubmissionStatus.NOT_SUBMITTED;
    const submittedAt = isSubmitted ? daysAgo(plan.daysAgo ?? 1) : null;
    const gradedAt =
      plan.status === SubmissionStatus.GRADED || plan.status === SubmissionStatus.REJECTED
        ? daysAgo(Math.max(0, (plan.daysAgo ?? 1) - 1))
        : null;

    await prisma.projectSubmission.upsert({
      where: { projectId_userId: { projectId: project.id, userId } },
      update: {
        status: plan.status,
        fileName: isSubmitted ? fileNameFor(projectTitle) : null,
        fileSize: isSubmitted ? '2.4 MB' : null,
        fileUrl: isSubmitted ? 'https://example.com/uploads/demo.zip' : null,
        submittedAt,
        gradedAt,
        marksAwarded: plan.marksAwarded ?? null,
        deletedAt: null,
      },
      create: {
        projectId: project.id,
        userId,
        status: plan.status,
        fileName: isSubmitted ? fileNameFor(projectTitle) : null,
        fileSize: isSubmitted ? '2.4 MB' : null,
        fileUrl: isSubmitted ? 'https://example.com/uploads/demo.zip' : null,
        submittedAt,
        gradedAt,
        marksAwarded: plan.marksAwarded ?? null,
      },
    });
  }
}

async function upsertAssignmentSubmissions(
  prisma: SeederContext['prisma'],
  userId: string,
  spec: DemoUserSpec,
): Promise<void> {
  for (const [assignmentTitle, plan] of Object.entries(spec.assignmentPlans)) {
    const assignment = await prisma.assignment.findFirst({
      where: { title: assignmentTitle, deletedAt: null, status: { not: AssignmentStatus.ARCHIVED } },
      select: { id: true },
    });
    if (!assignment) continue;

    const isSubmitted = plan.status !== SubmissionStatus.NOT_SUBMITTED;
    const submittedAt = isSubmitted ? daysAgo(plan.daysAgo ?? 1) : null;

    await prisma.assignmentSubmission.upsert({
      where: { assignmentId_userId: { assignmentId: assignment.id, userId } },
      update: {
        status: plan.status,
        submittedAt,
        gradeLabel: plan.gradeLabel ?? null,
        marksAwarded: plan.marksAwarded ?? null,
        totalMarks: 100,
        feedback: plan.feedback ?? null,
        fileUrl: isSubmitted ? 'https://example.com/uploads/demo.pdf' : null,
        deletedAt: null,
      },
      create: {
        assignmentId: assignment.id,
        userId,
        status: plan.status,
        submittedAt,
        gradeLabel: plan.gradeLabel ?? null,
        marksAwarded: plan.marksAwarded ?? null,
        totalMarks: 100,
        feedback: plan.feedback ?? null,
        fileUrl: isSubmitted ? 'https://example.com/uploads/demo.pdf' : null,
      },
    });
  }
}

function fileNameFor(title: string): string {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.zip`;
}
