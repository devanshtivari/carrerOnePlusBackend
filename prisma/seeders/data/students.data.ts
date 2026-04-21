/**
 * Student seed data extracted from frontend leaderboard + dashboard data.
 * Provides real Users so classes / enrollments / leaderboards have something
 * to point at in dev/staging environments.
 */

export interface StudentSeed {
  email: string;
  fullName: string;
  initials: string;
  totalScore: number;
  schoolName?: string;
  grade?: string;
  isCurrentUserMock?: boolean;
}

export const SCHOOL_NAME = 'CareerOne Academy';

export const studentsSeedData: StudentSeed[] = [
  // Class scope (from frontend Leaderboard/data.ts)
  { email: 'eleanor.pena@careerone.dev', fullName: 'Eleanor Pena', initials: 'EP', totalScore: 2450, schoolName: SCHOOL_NAME, grade: '10' },
  { email: 'jacob.jones@careerone.dev', fullName: 'Jacob Jones', initials: 'JJ', totalScore: 2310, schoolName: SCHOOL_NAME, grade: '10' },
  { email: 'cody.fisher@careerone.dev', fullName: 'Cody Fisher', initials: 'CF', totalScore: 1980, schoolName: SCHOOL_NAME, grade: '10' },
  { email: 'arlene.mccoy@careerone.dev', fullName: 'Arlene McCoy', initials: 'AM', totalScore: 1850, schoolName: SCHOOL_NAME, grade: '10' },
  { email: 'alex.johnson@careerone.dev', fullName: 'Alex Johnson', initials: 'AJ', totalScore: 1250, schoolName: SCHOOL_NAME, grade: '10', isCurrentUserMock: true },
  { email: 'esther.howard@careerone.dev', fullName: 'Esther Howard', initials: 'EH', totalScore: 1120, schoolName: SCHOOL_NAME, grade: '10' },
  { email: 'cameron.williamson@careerone.dev', fullName: 'Cameron Williamson', initials: 'CW', totalScore: 980, schoolName: SCHOOL_NAME, grade: '10' },
  { email: 'bessie.cooper@careerone.dev', fullName: 'Bessie Cooper', initials: 'BC', totalScore: 850, schoolName: SCHOOL_NAME, grade: '10' },
  { email: 'wade.warren@careerone.dev', fullName: 'Wade Warren', initials: 'WW', totalScore: 720, schoolName: SCHOOL_NAME, grade: '10' },
  { email: 'kristin.watson@careerone.dev', fullName: 'Kristin Watson', initials: 'KW', totalScore: 650, schoolName: SCHOOL_NAME, grade: '10' },

  // School scope (rest of school)
  { email: 'aditya.verma@careerone.dev', fullName: 'Aditya Verma', initials: 'AV', totalScore: 4820, schoolName: SCHOOL_NAME, grade: '12' },
  { email: 'ishita.bansal@careerone.dev', fullName: 'Ishita Bansal', initials: 'IB', totalScore: 4650, schoolName: SCHOOL_NAME, grade: '12' },
  { email: 'rahul.menon@careerone.dev', fullName: 'Rahul Menon', initials: 'RM', totalScore: 4100, schoolName: SCHOOL_NAME, grade: '12' },
  { email: 'nisha.kapoor@careerone.dev', fullName: 'Nisha Kapoor', initials: 'NK', totalScore: 3400, schoolName: SCHOOL_NAME, grade: '11' },
  { email: 'kabir.saxena@careerone.dev', fullName: 'Kabir Saxena', initials: 'KS', totalScore: 3100, schoolName: SCHOOL_NAME, grade: '11' },
  { email: 'meghna.rao@careerone.dev', fullName: 'Meghna Rao', initials: 'MR', totalScore: 2500, schoolName: SCHOOL_NAME, grade: '11' },
  { email: 'vivaan.bhat@careerone.dev', fullName: 'Vivaan Bhat', initials: 'VB', totalScore: 2200, schoolName: SCHOOL_NAME, grade: '11' },
  { email: 'simran.dhillon@careerone.dev', fullName: 'Simran Dhillon', initials: 'SD', totalScore: 1950, schoolName: SCHOOL_NAME, grade: '11' },

  // Other schools (national)
  { email: 'ravi.kumar@example.com', fullName: 'Ravi Kumar', initials: 'RK', totalScore: 9850, schoolName: 'Delhi Public School', grade: '12' },
  { email: 'priya.sharma@example.com', fullName: 'Priya Sharma', initials: 'PS', totalScore: 9620, schoolName: 'St Xavier Mumbai', grade: '12' },
  { email: 'arjun.mehta@example.com', fullName: 'Arjun Mehta', initials: 'AR', totalScore: 8700, schoolName: 'Doon School', grade: '11' },
  { email: 'sneha.reddy@example.com', fullName: 'Sneha Reddy', initials: 'SR', totalScore: 8400, schoolName: 'Kendriya Hyderabad', grade: '12' },
];
