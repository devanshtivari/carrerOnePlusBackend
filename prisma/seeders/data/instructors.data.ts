/**
 * Instructor seed data — extracted from frontend course data files
 * (CoursesPage, CourseCatalog, CourseOverview). These users are created
 * with INSTRUCTOR role so courses can be linked to them via instructorId.
 *
 * Passwords are intentionally seeded as a placeholder hash — these accounts
 * are not meant for direct sign-in in dev/local environments. Real password
 * provisioning happens through the auth-service register flow.
 */
export interface InstructorSeed {
  email: string;
  fullName: string;
  initials: string;
  instructorTitle?: string;
  bio?: string;
}

export const instructorsSeedData: InstructorSeed[] = [
  {
    email: 'alex.rivera@careerone.dev',
    fullName: 'Alex Rivera',
    initials: 'AR',
    instructorTitle: 'Senior Full-Stack Engineer',
    bio: 'Builds large-scale React + Node platforms; ex-Stripe.',
  },
  {
    email: 'alan.turing@careerone.dev',
    fullName: 'Dr. Alan Turing',
    initials: 'AT',
    instructorTitle: 'PhD in Artificial Intelligence',
    bio: 'Deep learning researcher and author of multiple ML textbooks.',
  },
  {
    email: 'maya.patel@careerone.dev',
    fullName: 'Dr. Maya Patel',
    initials: 'MP',
    instructorTitle: 'Data Science Researcher',
    bio: 'Applied statistician and Pandas core contributor.',
  },
  {
    email: 'james.moriarty@careerone.dev',
    fullName: 'James Moriarty',
    initials: 'JM',
    instructorTitle: 'Offensive Security Lead',
    bio: 'Top 50 HackerOne researcher; ex-NSA red team.',
  },
  {
    email: 'sofia.nguyen@careerone.dev',
    fullName: 'Sofia Nguyen',
    initials: 'SN',
    instructorTitle: 'Lead Product Designer',
    bio: 'Designed flagship products at Figma and Notion.',
  },
  {
    email: 'jake.morrison@careerone.dev',
    fullName: 'Jake Morrison',
    initials: 'JM',
    instructorTitle: 'Mobile Engineering Lead',
    bio: 'Ships React Native apps used by millions.',
  },
  {
    email: 'sarah.chen@careerone.dev',
    fullName: 'Sarah Chen',
    initials: 'SC',
    instructorTitle: 'Robotics Engineering Lead',
    bio: 'Robotics and distributed systems engineer.',
  },
  {
    email: 'lisa.park@careerone.dev',
    fullName: 'Lisa Park',
    initials: 'LP',
    instructorTitle: 'Product Strategist',
    bio: 'Growth and product leader for B2B SaaS companies.',
  },
  {
    email: 'sarah.chen.ai@careerone.dev',
    fullName: 'Dr. Sarah Chen',
    initials: 'SC',
    instructorTitle: 'PhD in Artificial Intelligence',
    bio: 'AI faculty researcher specialising in NLP and ethics.',
  },
  {
    email: 'jamie.doe@careerone.dev',
    fullName: 'Jamie Doe',
    initials: 'JD',
    instructorTitle: 'Lead Product Designer',
    bio: 'Design systems and accessibility specialist.',
  },
  // Referenced by feedback.seeder.ts and calendar-events.seeder.ts —
  // keep these entries so those seeders resolve their FK lookups.
  {
    email: 'sarah.miller@careerone.dev',
    fullName: 'Dr. Sarah Miller',
    initials: 'SM',
    instructorTitle: 'Head of Academic Programmes',
    bio: 'Oversees CS curriculum; ex-Google engineering manager.',
  },
  {
    email: 'david.chen@careerone.dev',
    fullName: 'David Chen',
    initials: 'DC',
    instructorTitle: 'Python & Data Structures Teacher',
    bio: '10 years teaching Python to grades 6-12; author of three workbooks.',
  },
];
