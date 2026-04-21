import { PrismaClient } from '@prisma/client';

import { seedCategories } from './categories.seeder';
import { seedInstructors } from './instructors.seeder';
import { seedStudents } from './students.seeder';
import { seedAdmins } from './admins.seeder';
import { seedCourses } from './courses.seeder';
import { seedEnrollments } from './enrollments.seeder';
import { seedLessonCompletions } from './lesson-completions.seeder';
import { seedTests } from './tests.seeder';
import { seedTestAttempts } from './test-attempts.seeder';
import { seedProjects } from './projects.seeder';
import { seedProjectSubmissions } from './project-submissions.seeder';
import { seedAssignments } from './assignments.seeder';
import { seedAssignmentSubmissions } from './assignment-submissions.seeder';
import { seedClasses } from './classes.seeder';
import { seedDemoUsers } from './demo-users.seeder';
import { seedLeaderboard } from './leaderboard.seeder';
import { seedAnnouncements } from './announcements.seeder';
import { seedNotifications } from './notifications.seeder';
import { seedFeedback } from './feedback.seeder';
import { seedLabs } from './labs.seeder';
import { seedAlerts } from './alerts.seeder';
import { seedCalendarEvents } from './calendar-events.seeder';
import { seedReports } from './reports.seeder';
import { seedResults } from './results.seeder';

export interface SeederContext {
  prisma: PrismaClient;
}

export interface Seeder {
  name: string;
  run: (ctx: SeederContext) => Promise<void>;
}

/**
 * Order matters: catalog → enrollments-dependent things → analytics.
 * Add new seeders here as new modules ship.
 */
export const seeders: Seeder[] = [
  { name: 'categories', run: seedCategories },
  { name: 'instructors', run: seedInstructors },
  { name: 'students', run: seedStudents },
  { name: 'admins', run: seedAdmins },
  { name: 'courses', run: seedCourses },
  { name: 'enrollments', run: seedEnrollments },
  { name: 'lesson-completions', run: seedLessonCompletions },
  { name: 'classes', run: seedClasses },
  { name: 'tests', run: seedTests },
  { name: 'test-attempts', run: seedTestAttempts },
  { name: 'projects', run: seedProjects },
  { name: 'project-submissions', run: seedProjectSubmissions },
  { name: 'assignments', run: seedAssignments },
  { name: 'assignment-submissions', run: seedAssignmentSubmissions },
  { name: 'demo-users', run: seedDemoUsers },
  { name: 'leaderboard', run: seedLeaderboard },
  { name: 'announcements', run: seedAnnouncements },
  { name: 'notifications', run: seedNotifications },
  { name: 'feedback', run: seedFeedback },
  { name: 'labs', run: seedLabs },
  { name: 'alerts', run: seedAlerts },
  { name: 'calendar-events', run: seedCalendarEvents },
  { name: 'reports', run: seedReports },
  { name: 'results', run: seedResults },
];
