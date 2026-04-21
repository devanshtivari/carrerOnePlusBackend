/**
 * Project seed data — extracted from
 *   frontend/src/components/features/student/ProjectSubmission/data.ts
 *
 * Projects are scoped to a course (by slug). Unit linkage is intentionally
 * left blank — units are seeded separately from a different source-of-truth
 * dataset and the IDs are not stable across runs. Tests do not depend on
 * unit linkage.
 */

export interface ProjectSeed {
  title: string;
  description: string;
  imageUrl: string;
  deadline: string; // ISO date
  totalMarks: number;
  isActive: boolean;
  courseSlug?: string;
}

export const projectsSeedData: ProjectSeed[] = [
  // Class 6 — AI & Robotics fundamentals
  {
    title: 'Build Your First Bot',
    description:
      'Learn robotics fundamentals by building a virtual assistant with AI logic.',
    imageUrl:
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=600&auto=format&fit=crop',
    deadline: '2026-10-15',
    totalMarks: 100,
    isActive: true,
    courseSlug: 'introduction-to-robotics',
  },
  {
    title: 'Solar System Model',
    description:
      'Create a 3D interactive model of our planetary system using WebGL.',
    imageUrl:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop',
    deadline: '2026-10-20',
    totalMarks: 100,
    isActive: true,
    courseSlug: 'introduction-to-robotics',
  },
  {
    title: 'Line Following Robot',
    description:
      'Program a robot to follow a line using IR sensors and PID control.',
    imageUrl:
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=600&auto=format&fit=crop',
    deadline: '2026-11-05',
    totalMarks: 100,
    isActive: true,
    courseSlug: 'introduction-to-robotics',
  },

  // Class 7 — Python + ML
  {
    title: 'Python Robot Controller',
    description:
      'Write a Python script to control motor speed and direction remotely.',
    imageUrl:
      'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?q=80&w=600&auto=format&fit=crop',
    deadline: '2026-10-18',
    totalMarks: 100,
    isActive: true,
    courseSlug: 'python-data-science',
  },
  {
    title: 'Data Visualization Dashboard',
    description:
      'Build an interactive dashboard to display sensor data using Matplotlib.',
    imageUrl:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600&auto=format&fit=crop',
    deadline: '2026-10-25',
    totalMarks: 100,
    isActive: true,
    courseSlug: 'python-data-science',
  },
  {
    title: 'Handwriting Recognizer',
    description:
      'Train a neural network on the MNIST dataset to recognize handwritten digits.',
    imageUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=600&auto=format&fit=crop',
    deadline: '2026-11-18',
    totalMarks: 100,
    isActive: true,
    courseSlug: 'deep-learning-from-scratch',
  },

  // Class 8 — Computer Vision & Industrial Automation
  {
    title: 'Face Detection System',
    description:
      'Build a real-time face detection system using OpenCV and Haar cascades.',
    imageUrl:
      'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?q=80&w=600&auto=format&fit=crop',
    deadline: '2026-10-20',
    totalMarks: 100,
    isActive: true,
    courseSlug: 'ai-and-machine-learning',
  },
  {
    title: 'Object Tracking Pipeline',
    description:
      'Implement a multi-object tracker using a centroid-tracking algorithm.',
    imageUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=600&auto=format&fit=crop',
    deadline: '2026-10-28',
    totalMarks: 100,
    isActive: true,
    courseSlug: 'ai-and-machine-learning',
  },

  // Class 9 — RL + Swarm
  {
    title: 'Q-Learning Grid World',
    description:
      'Implement a Q-learning agent that learns to navigate a grid world.',
    imageUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=600&auto=format&fit=crop',
    deadline: '2026-10-22',
    totalMarks: 100,
    isActive: true,
    courseSlug: 'deep-learning-from-scratch',
  },
  {
    title: 'Capstone: Autonomous Agent',
    description:
      'Final capstone project — design, build, and deploy a fully autonomous agent.',
    imageUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=600&auto=format&fit=crop',
    deadline: '2027-01-15',
    totalMarks: 100,
    isActive: true,
    courseSlug: 'deep-learning-from-scratch',
  },
];
