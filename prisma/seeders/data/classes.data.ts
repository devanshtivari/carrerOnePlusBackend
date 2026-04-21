import { ClassMembershipRole } from '@prisma/client';

import { SCHOOL_NAME } from './students.data';

export interface ClassMemberSeed {
  studentEmail: string;
  role?: ClassMembershipRole;
}

export interface ClassSeed {
  code: string;
  name: string;
  grade?: string;
  section?: string;
  schoolName?: string;
  description?: string;
  teachers: string[];
  members: ClassMemberSeed[];
}

export const classesSeedData: ClassSeed[] = [
  {
    code: 'g10-a-2026',
    name: 'Grade 10 — Section A',
    grade: '10',
    section: 'A',
    schoolName: SCHOOL_NAME,
    description: 'Primary classroom for AY 2025-26',
    teachers: ['alex.rivera@careerone.dev'],
    members: [
      { studentEmail: 'eleanor.pena@careerone.dev' },
      { studentEmail: 'jacob.jones@careerone.dev' },
      { studentEmail: 'cody.fisher@careerone.dev' },
      { studentEmail: 'arlene.mccoy@careerone.dev' },
      { studentEmail: 'alex.johnson@careerone.dev' },
      { studentEmail: 'esther.howard@careerone.dev' },
      { studentEmail: 'cameron.williamson@careerone.dev' },
      { studentEmail: 'bessie.cooper@careerone.dev' },
      { studentEmail: 'wade.warren@careerone.dev' },
      { studentEmail: 'kristin.watson@careerone.dev' },
    ],
  },
];
