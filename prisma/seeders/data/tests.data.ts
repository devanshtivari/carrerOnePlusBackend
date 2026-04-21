/**
 * Tests/quizzes seed data — extracted from
 *   frontend/src/components/features/student/Tests/data.ts
 *
 * Each test references a course by slug (optional). Questions include
 * MCQ options with `isCorrect` flags so the auto-grader has a ground truth.
 */

import { QuestionType, TestStatus, TestType } from '@prisma/client';

export interface QuestionOptionSeed {
  label: string;
  text: string;
  isCorrect?: boolean;
}

export interface QuestionSeed {
  position: number;
  type: QuestionType;
  prompt: string;
  marks: number;
  options?: QuestionOptionSeed[];
}

export interface TestSeed {
  code: string;
  title: string;
  description?: string;
  courseLabel?: string;
  courseSlug?: string;
  durationMinutes: number;
  type: TestType;
  status: TestStatus;
  scheduledAt?: string;
  questions: QuestionSeed[];
}

export const platformGuidelines: string[] = [
  'Do not refresh or close the browser during the test. Your progress will be lost.',
  'Each question carries the marks indicated next to it. There is no negative marking.',
  'For MCQ questions, select the single best answer from the options provided.',
  'For text-based questions, provide clear and concise answers in the text area.',
  'The timer starts as soon as you click "Begin Test". It cannot be paused.',
  'The test will auto-submit when the timer reaches zero.',
  'You may navigate between questions freely using the question navigation panel.',
  'Ensure a stable internet connection throughout the test duration.',
];

export const testsSeedData: TestSeed[] = [
  {
    code: 'TEST-001',
    title: 'Midterm: Data Structures & Algorithms',
    description:
      'Mid-term covering core data structures, algorithm design, and Big-O complexity.',
    courseLabel: 'Class 6 AI & Robotics',
    courseSlug: 'ai-and-machine-learning',
    durationMinutes: 30,
    type: TestType.MIXED,
    status: TestStatus.LIVE,
    scheduledAt: '2026-03-05T10:00:00.000Z',
    questions: [
      {
        position: 1,
        type: QuestionType.MCQ,
        prompt: 'Which data structure uses LIFO (Last In, First Out) principle?',
        marks: 5,
        options: [
          { label: 'a', text: 'Queue' },
          { label: 'b', text: 'Stack', isCorrect: true },
          { label: 'c', text: 'Linked List' },
          { label: 'd', text: 'Binary Tree' },
        ],
      },
      {
        position: 2,
        type: QuestionType.MCQ,
        prompt: 'What is the time complexity of binary search on a sorted array?',
        marks: 5,
        options: [
          { label: 'a', text: 'O(n)' },
          { label: 'b', text: 'O(n²)' },
          { label: 'c', text: 'O(log n)', isCorrect: true },
          { label: 'd', text: 'O(1)' },
        ],
      },
      {
        position: 3,
        type: QuestionType.TEXT,
        prompt:
          'Explain the difference between a stack and a queue. Provide real-world examples of each.',
        marks: 8,
      },
      {
        position: 4,
        type: QuestionType.MCQ,
        prompt:
          'Which traversal of a Binary Search Tree gives elements in sorted order?',
        marks: 5,
        options: [
          { label: 'a', text: 'Pre-order' },
          { label: 'b', text: 'In-order', isCorrect: true },
          { label: 'c', text: 'Post-order' },
          { label: 'd', text: 'Level-order' },
        ],
      },
      {
        position: 5,
        type: QuestionType.MCQ,
        prompt: 'What is the worst-case time complexity of Quick Sort?',
        marks: 5,
        options: [
          { label: 'a', text: 'O(n log n)' },
          { label: 'b', text: 'O(n²)', isCorrect: true },
          { label: 'c', text: 'O(n)' },
          { label: 'd', text: 'O(log n)' },
        ],
      },
      {
        position: 6,
        type: QuestionType.TEXT,
        prompt:
          'Describe how a hash table handles collisions. Name at least two collision resolution techniques.',
        marks: 7,
      },
      {
        position: 7,
        type: QuestionType.MCQ,
        prompt: 'Which of the following is NOT a linear data structure?',
        marks: 5,
        options: [
          { label: 'a', text: 'Array' },
          { label: 'b', text: 'Linked List' },
          { label: 'c', text: 'Graph', isCorrect: true },
          { label: 'd', text: 'Stack' },
        ],
      },
      {
        position: 8,
        type: QuestionType.MCQ,
        prompt: 'In a doubly linked list, each node contains how many pointers?',
        marks: 5,
        options: [
          { label: 'a', text: '1' },
          { label: 'b', text: '2', isCorrect: true },
          { label: 'c', text: '3' },
          { label: 'd', text: '0' },
        ],
      },
      {
        position: 9,
        type: QuestionType.MCQ,
        prompt: 'Which algorithm is used to find the shortest path in a weighted graph?',
        marks: 5,
        options: [
          { label: 'a', text: 'BFS' },
          { label: 'b', text: 'DFS' },
          { label: 'c', text: "Dijkstra's Algorithm", isCorrect: true },
          { label: 'd', text: 'Merge Sort' },
        ],
      },
      {
        position: 10,
        type: QuestionType.TEXT,
        prompt:
          'Write a step-by-step explanation of how the Merge Sort algorithm works. Include its time and space complexity.',
        marks: 0,
      },
    ],
  },
  {
    code: 'TEST-002',
    title: 'Quiz: Python Fundamentals',
    description: 'Short quiz to validate Python syntax and core concepts.',
    courseLabel: 'Class 7 AI & Robotics',
    courseSlug: 'python-data-science',
    durationMinutes: 15,
    type: TestType.MCQ,
    status: TestStatus.UPCOMING,
    scheduledAt: '2026-03-08T14:00:00.000Z',
    questions: [
      {
        position: 1,
        type: QuestionType.MCQ,
        prompt: 'Which keyword is used to define a function in Python?',
        marks: 2,
        options: [
          { label: 'a', text: 'function' },
          { label: 'b', text: 'def', isCorrect: true },
          { label: 'c', text: 'fn' },
          { label: 'd', text: 'lambda' },
        ],
      },
      {
        position: 2,
        type: QuestionType.MCQ,
        prompt: 'What is the output of `len([1, 2, 3])`?',
        marks: 2,
        options: [
          { label: 'a', text: '2' },
          { label: 'b', text: '3', isCorrect: true },
          { label: 'c', text: 'Error' },
          { label: 'd', text: 'None' },
        ],
      },
      {
        position: 3,
        type: QuestionType.MCQ,
        prompt: 'Which of these is an immutable type in Python?',
        marks: 3,
        options: [
          { label: 'a', text: 'list' },
          { label: 'b', text: 'dict' },
          { label: 'c', text: 'tuple', isCorrect: true },
          { label: 'd', text: 'set' },
        ],
      },
    ],
  },
  {
    code: 'TEST-003',
    title: 'Final Assessment: Machine Learning Basics',
    description:
      'Final assessment validating supervised learning, evaluation metrics, and overfitting concepts.',
    courseLabel: 'Class 8 AI & Robotics',
    courseSlug: 'deep-learning-from-scratch',
    durationMinutes: 60,
    type: TestType.MIXED,
    status: TestStatus.UPCOMING,
    scheduledAt: '2026-03-12T11:00:00.000Z',
    questions: [
      {
        position: 1,
        type: QuestionType.MCQ,
        prompt: 'Which metric is best for highly-imbalanced binary classification?',
        marks: 5,
        options: [
          { label: 'a', text: 'Accuracy' },
          { label: 'b', text: 'F1 score', isCorrect: true },
          { label: 'c', text: 'Mean squared error' },
          { label: 'd', text: 'R²' },
        ],
      },
      {
        position: 2,
        type: QuestionType.TEXT,
        prompt: 'Explain the difference between bias and variance.',
        marks: 5,
      },
    ],
  },
  {
    code: 'TEST-004',
    title: 'Unit Test: Robotics Fundamentals',
    description: 'Subjective unit test on sensors, actuators, and embedded controllers.',
    courseLabel: 'Class 6 AI & Robotics',
    courseSlug: 'introduction-to-robotics',
    durationMinutes: 20,
    type: TestType.SUBJECTIVE,
    status: TestStatus.COMPLETED,
    scheduledAt: '2026-02-28T09:00:00.000Z',
    questions: [
      {
        position: 1,
        type: QuestionType.TEXT,
        prompt: 'Describe how an ultrasonic sensor measures distance.',
        marks: 5,
      },
      {
        position: 2,
        type: QuestionType.TEXT,
        prompt: 'Compare DC motors and servo motors with respect to torque and control.',
        marks: 5,
      },
    ],
  },
];
