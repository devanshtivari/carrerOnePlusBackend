/**
 * Assignment seed data — extracted from
 *   frontend/src/components/features/teacher/ProjectsLab/data.ts
 *
 * Each assignment optionally references a class by code (see classes.data.ts)
 * and a course by slug. The current frontend mocks reference legacy class
 * codes (c6, c7, c8, c9). Until those frontend codes graduate to real
 * classes, we fall back to the single seeded class (g10-a-2026).
 */

import { AssignmentStatus } from '@prisma/client';

export interface AssignmentSeed {
  title: string;
  description?: string;
  dueDate: string; // ISO date
  status: AssignmentStatus;
  totalStudents: number;
  submittedCount: number;
  classCode?: string;
  courseSlug?: string;
}

export const assignmentsSeedData: AssignmentSeed[] = [
  {
    title: 'Intro to HTML — My First Page',
    description: 'Build a single-file HTML page with semantic structure and a hero section.',
    dueDate: '2026-11-12',
    status: AssignmentStatus.ACTIVE,
    totalStudents: 38,
    submittedCount: 16,
    classCode: 'g10-a-2026',
    courseSlug: 'fullstack-react-node',
  },
  {
    title: 'Typing Speed Challenge',
    description: 'Practice typing — log your words-per-minute over 5 attempts.',
    dueDate: '2026-11-05',
    status: AssignmentStatus.COMPLETED,
    totalStudents: 38,
    submittedCount: 33,
    classCode: 'g10-a-2026',
  },
  {
    title: 'Scratch Animated Story',
    description: 'Create a short animated story using Scratch with at least 3 sprites.',
    dueDate: '2026-11-15',
    status: AssignmentStatus.ACTIVE,
    totalStudents: 40,
    submittedCount: 23,
    classCode: 'g10-a-2026',
  },
  {
    title: 'Algorithms Worksheet',
    description: 'Solve five algorithmic problems with pseudocode and complexity analysis.',
    dueDate: '2026-11-20',
    status: AssignmentStatus.ACTIVE,
    totalStudents: 40,
    submittedCount: 20,
    classCode: 'g10-a-2026',
    courseSlug: 'python-data-science',
  },
  {
    title: 'Python Basics Quiz Recap',
    description: 'Submit a write-up of the topics that gave you trouble in the Python quiz.',
    dueDate: '2026-12-01',
    status: AssignmentStatus.ACTIVE,
    totalStudents: 38,
    submittedCount: 12,
    classCode: 'g10-a-2026',
    courseSlug: 'python-data-science',
  },
];
