/**
 * Course catalog seed data — extracted from
 *   frontend/src/components/features/courses/CourseCatalog/data.ts
 *   frontend/src/components/features/courses/CoursesPage/data.ts
 *   frontend/src/components/features/courses/CourseOverview/data.ts
 *   frontend/src/components/features/courses/UnitOverview/data.ts
 *
 * Each course is keyed by a stable slug; instructors are referenced by email
 * so the seeder can resolve them to user ids at insert time. Categories are
 * referenced by slug.
 *
 * Pricing is normalised to integer cents (₹799 → 79900) per the schema's
 * priceCents/originalPriceCents fields.
 */

import { CourseLevel, LessonType, ResourceKind, UnitStatus } from '@prisma/client';

export interface LessonSeed {
  position: number;
  title: string;
  type: LessonType;
  durationLabel: string;
}

export interface ChapterSeed {
  position: number;
  title: string;
  description?: string;
  durationLabel?: string;
  lessons: LessonSeed[];
}

export interface ResourceSeed {
  name: string;
  kind: ResourceKind;
  url?: string;
  sizeLabel?: string;
}

export interface UnitSeed {
  moduleNumber: number;
  title: string;
  description?: string;
  imageUrl?: string;
  durationLabel?: string;
  status?: UnitStatus;
  isLocked?: boolean;
  chapters?: ChapterSeed[];
  resources?: ResourceSeed[];
}

export interface CourseSeed {
  slug: string;
  title: string;
  shortName?: string;
  description: string;
  imageUrl?: string;
  level: CourseLevel;
  badge?: string;
  priceCents?: number;
  originalPriceCents?: number;
  currency?: string;
  durationLabel?: string;
  ratingAvg?: number;
  ratingCount?: number;
  enrolledLabel?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  classmateCount?: number;
  learnings?: string[];
  tags?: string[];
  /**
   * Grade levels this course is suitable for — the seeder injects these as
   * `grade:<n>` entries into the `tags` column so the frontend can filter
   * `/courses?grade=10` without a schema change.
   */
  gradeLevels?: string[];
  totalLessons?: number;
  totalUnits?: number;
  totalTopics?: number;
  totalTests?: number;
  totalProjects?: number;
  categorySlug?: string;
  instructorEmail?: string;
  units?: UnitSeed[];
}

/**
 * Canonical tag prefix for grade-level filtering. Kept here so both the
 * seeder and any future admin tooling use the exact same string.
 */
export const GRADE_TAG_PREFIX = 'grade:';

/**
 * Per-slug grade-level assignments. Each course is available to the listed
 * grades; choose 2-3 courses per grade to match the pedagogy brief
 * (Classes 6-10).
 */
export const courseGradeAssignments: Record<string, string[]> = {
  // Grade 6 — introductory building-blocks
  'ai-and-machine-learning': ['6', '10'],
  'python-data-science': ['6', '7'],
  'introduction-to-robotics': ['6'],
  // Grade 7
  'python-data-science-bootcamp': ['7'],
  'fullstack-react-node': ['7', '8'],
  'uiux-design-principles': ['7', '9'],
  // Grade 8
  'deep-learning-from-scratch': ['8', '10'],
  'react-nextjs-masterclass-2026': ['8'],
  'react-native-and-expo': ['8', '9'],
  // Grade 9
  'ethical-hacking-and-pentesting': ['9'],
  'figma-to-production': ['9'],
  'fullstack-node-microservices': ['9', '10'],
  // Grade 10 — capstone / portfolio oriented
  'product-management-growth': ['10'],
};

export const coursesSeedData: CourseSeed[] = [
  // ─── Detailed courses (with curriculum) ────────────────────────────────
  {
    slug: 'ai-and-machine-learning',
    title: 'Artificial Intelligence and Machine Learning',
    shortName: 'AI & ML',
    description:
      'Master the fundamentals of AI, neural networks, and predictive modeling with hands-on projects. Dive deep into supervised learning, deep learning, and natural language processing.',
    imageUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=600&auto=format&fit=crop',
    level: CourseLevel.ADVANCED,
    badge: 'Bestseller',
    durationLabel: '28h',
    ratingAvg: 4.8,
    ratingCount: 12840,
    enrolledLabel: '12.4k',
    isFeatured: true,
    classmateCount: 1200,
    tags: ['AI', 'ML', 'PyTorch'],
    totalUnits: 5,
    totalTopics: 24,
    totalLessons: 21,
    totalTests: 8,
    totalProjects: 12,
    learnings: [
      'Implement foundational ML algorithms from scratch.',
      'Build and train Deep Neural Networks with PyTorch.',
      'Optimize model performance and handle large datasets.',
      'Deploy AI models to production environments.',
    ],
    categorySlug: 'ai-ml',
    instructorEmail: 'sarah.chen.ai@careerone.dev',
    units: [
      {
        moduleNumber: 1,
        title: 'Introduction to AI & Data Science',
        description:
          'This unit covers the fundamental concepts, history, and applications of Artificial Intelligence and how it intersects with modern Data Science practices.',
        imageUrl:
          'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop',
        status: UnitStatus.COMPLETED,
        isLocked: false,
        durationLabel: '1.5 Hours',
        chapters: [
          {
            position: 1,
            title: 'Chapter 1',
            description: 'Introduction and History',
            durationLabel: '1h 30m',
            lessons: [
              { position: 1, title: 'What is Artificial Intelligence?', type: LessonType.LESSON, durationLabel: '30:00' },
              { position: 2, title: 'History of AI: From Turing to Transformers', type: LessonType.QUIZ, durationLabel: '28:13' },
            ],
          },
          {
            position: 2,
            title: 'Chapter 2',
            description: 'Core Concepts',
            durationLabel: '1h 30m',
            lessons: [
              { position: 1, title: 'Narrow AI vs. General AI', type: LessonType.LESSON, durationLabel: '22:45' },
              { position: 2, title: 'Introduction to Machine Learning Pipelines', type: LessonType.LAB, durationLabel: '45:00' },
            ],
          },
          {
            position: 3,
            title: 'Chapter 3',
            description: 'Ethics and Applications',
            durationLabel: '1h 20m',
            lessons: [
              { position: 1, title: 'Ethics in AI and Data Privacy', type: LessonType.CASE_STUDY, durationLabel: '25:00' },
            ],
          },
        ],
        resources: [
          { name: 'Unit 1 Introduction PDF', kind: ResourceKind.PDF, sizeLabel: '2.4 MB' },
          { name: 'Practice Dataset (CSV)', kind: ResourceKind.CSV, sizeLabel: 'external' },
        ],
      },
      {
        moduleNumber: 2,
        title: 'Supervised Learning Models',
        description:
          'Dive into supervised learning algorithms—linear regression, decision trees, and ensemble methods with hands-on projects.',
        imageUrl:
          'https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=800&auto=format&fit=crop',
        status: UnitStatus.IN_PROGRESS,
        isLocked: false,
        durationLabel: '4 Hours',
        chapters: [
          {
            position: 1,
            title: 'Chapter 1',
            description: 'Fundamentals of Regression',
            durationLabel: '2h 00m',
            lessons: [
              { position: 1, title: 'Linear Regression from Scratch', type: LessonType.LESSON, durationLabel: '45:00' },
              { position: 2, title: 'Gradient Descent Optimization', type: LessonType.LESSON, durationLabel: '38:00' },
            ],
          },
          {
            position: 2,
            title: 'Chapter 2',
            description: 'Tree Models',
            durationLabel: '2h 00m',
            lessons: [
              { position: 1, title: 'Decision Trees & Random Forests', type: LessonType.LAB, durationLabel: '50:00' },
              { position: 2, title: 'Support Vector Machines', type: LessonType.LESSON, durationLabel: '40:00' },
            ],
          },
          {
            position: 3,
            title: 'Chapter 3',
            description: 'Evaluation and Advanced Concepts',
            durationLabel: '2h 15m',
            lessons: [
              { position: 1, title: 'Model Evaluation Metrics', type: LessonType.QUIZ, durationLabel: '30:00' },
              { position: 2, title: 'Ensemble Methods Capstone', type: LessonType.LAB, durationLabel: '55:00' },
            ],
          },
        ],
        resources: [
          { name: 'Supervised Learning PDF', kind: ResourceKind.PDF, sizeLabel: '3.1 MB' },
          { name: 'Housing Dataset', kind: ResourceKind.CSV, sizeLabel: 'external' },
        ],
      },
      {
        moduleNumber: 3,
        title: 'Deep Learning Fundamentals',
        description:
          'Explore neural network architectures, backpropagation, CNNs, and modern deep learning frameworks.',
        imageUrl:
          'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&auto=format&fit=crop',
        status: UnitStatus.LOCKED,
        isLocked: true,
        durationLabel: '6 Hours',
        chapters: [
          {
            position: 1,
            title: 'Chapter 1',
            description: 'Neural Networks & Backpropagation',
            durationLabel: '2h 30m',
            lessons: [
              { position: 1, title: 'Neural Network Architecture', type: LessonType.LESSON, durationLabel: '55:00' },
              { position: 2, title: 'Backpropagation Algorithm', type: LessonType.LESSON, durationLabel: '45:00' },
            ],
          },
          {
            position: 2,
            title: 'Chapter 2',
            description: 'Advanced Architectures',
            durationLabel: '2h 30m',
            lessons: [
              { position: 1, title: 'Convolutional Neural Networks', type: LessonType.LAB, durationLabel: '60:00' },
              { position: 2, title: 'Transfer Learning', type: LessonType.LESSON, durationLabel: '40:00' },
            ],
          },
          {
            position: 3,
            title: 'Chapter 3',
            description: 'Deep Learning Applications',
            durationLabel: '2h 00m',
            lessons: [
              { position: 1, title: 'Deep Learning Project', type: LessonType.LAB, durationLabel: '90:00' },
            ],
          },
        ],
        resources: [{ name: 'DL Fundamentals PDF', kind: ResourceKind.PDF, sizeLabel: '4.2 MB' }],
      },
      {
        moduleNumber: 4,
        title: 'Natural Language Processing',
        description:
          'Master text processing, sentiment analysis, and transformer-based models for NLP tasks.',
        imageUrl:
          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
        status: UnitStatus.LOCKED,
        isLocked: true,
        durationLabel: '5 Hours',
        chapters: [
          {
            position: 1,
            title: 'Chapter 1',
            description: 'Text Processing',
            durationLabel: '2h 00m',
            lessons: [
              { position: 1, title: 'Text Preprocessing & Tokenization', type: LessonType.LESSON, durationLabel: '35:00' },
              { position: 2, title: 'Word Embeddings (Word2Vec, GloVe)', type: LessonType.LESSON, durationLabel: '45:00' },
            ],
          },
          {
            position: 2,
            title: 'Chapter 2',
            description: 'RNNs & Transformers',
            durationLabel: '2h 00m',
            lessons: [
              { position: 1, title: 'Recurrent Neural Networks for NLP', type: LessonType.LAB, durationLabel: '50:00' },
              { position: 2, title: 'Transformer Architecture', type: LessonType.LESSON, durationLabel: '55:00' },
            ],
          },
          {
            position: 3,
            title: 'Chapter 3',
            description: 'NLP Application',
            durationLabel: '1h 30m',
            lessons: [
              { position: 1, title: 'Sentiment Analysis Project', type: LessonType.LAB, durationLabel: '60:00' },
            ],
          },
        ],
        resources: [{ name: 'NLP Guide PDF', kind: ResourceKind.PDF, sizeLabel: '3.5 MB' }],
      },
      {
        moduleNumber: 5,
        title: 'AI Ethics & Deployment',
        description:
          'Learn responsible AI practices, model deployment strategies, and MLOps fundamentals.',
        imageUrl:
          'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
        status: UnitStatus.LOCKED,
        isLocked: true,
        durationLabel: '3 Hours',
        chapters: [
          {
            position: 1,
            title: 'Chapter 1',
            description: 'Ethics in AI',
            durationLabel: '1h 30m',
            lessons: [
              { position: 1, title: 'Bias & Fairness in AI', type: LessonType.LESSON, durationLabel: '40:00' },
              { position: 2, title: 'Model Interpretability', type: LessonType.LESSON, durationLabel: '35:00' },
            ],
          },
          {
            position: 2,
            title: 'Chapter 2',
            description: 'Deployment',
            durationLabel: '1h 30m',
            lessons: [
              { position: 1, title: 'Deploying ML Models', type: LessonType.LAB, durationLabel: '50:00' },
            ],
          },
          {
            position: 3,
            title: 'Chapter 3',
            description: 'MLOps',
            durationLabel: '0h 45m',
            lessons: [
              { position: 1, title: 'MLOps & Monitoring', type: LessonType.CASE_STUDY, durationLabel: '45:00' },
            ],
          },
        ],
        resources: [{ name: 'Ethics & Deployment PDF', kind: ResourceKind.PDF, sizeLabel: '2.8 MB' }],
      },
    ],
  },

  {
    slug: 'introduction-to-robotics',
    title: 'Introduction to Robotics',
    shortName: 'Robotics',
    description:
      'Learn how to build and program your own robots using industry-standard tools and frameworks for real-world applications.',
    imageUrl:
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=600&auto=format&fit=crop',
    level: CourseLevel.INTERMEDIATE,
    badge: 'New Course',
    durationLabel: '24h',
    ratingAvg: 4.6,
    ratingCount: 3200,
    enrolledLabel: '3.2k',
    classmateCount: 860,
    tags: ['Robotics', 'ROS', 'Embedded'],
    totalUnits: 4,
    totalTopics: 18,
    totalLessons: 2,
    totalTests: 5,
    totalProjects: 8,
    learnings: [
      'Understand robotic kinematics and dynamics.',
      'Program robots with ROS 2 framework.',
      'Implement computer vision for robotics.',
      'Design autonomous navigation systems.',
    ],
    categorySlug: 'robotics',
    instructorEmail: 'sarah.chen@careerone.dev',
    units: [
      {
        moduleNumber: 1,
        title: 'Foundations of Robotics',
        description:
          'Understand the core principles of robotic systems, including sensors, actuators, and control theory.',
        imageUrl:
          'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800&auto=format&fit=crop',
        status: UnitStatus.LOCKED,
        isLocked: true,
        durationLabel: '2 Hours',
        chapters: [
          {
            position: 1,
            title: 'Chapter 1',
            description: 'Robotic Systems Overview',
            durationLabel: '1h 00m',
            lessons: [
              { position: 1, title: 'What is a Robot?', type: LessonType.LESSON, durationLabel: '30:00' },
              { position: 2, title: 'History of Robotics', type: LessonType.LESSON, durationLabel: '30:00' },
            ],
          },
        ],
        resources: [],
      },
    ],
  },

  {
    slug: 'fullstack-react-node',
    title: 'Full-Stack Web Development with React & Node',
    shortName: 'Full-Stack',
    description:
      'Master modern web architectures and build scalable applications from scratch using React, Node.js, and cloud services.',
    imageUrl:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600&auto=format&fit=crop',
    level: CourseLevel.ADVANCED,
    badge: 'Advanced',
    durationLabel: '40h',
    ratingAvg: 4.9,
    ratingCount: 6120,
    enrolledLabel: '18.7k',
    classmateCount: 2100,
    tags: ['React', 'Node.js', 'TypeScript'],
    totalUnits: 6,
    totalTopics: 32,
    totalLessons: 1,
    totalTests: 10,
    totalProjects: 15,
    learnings: [
      'Build complete React apps with modern hooks.',
      'Design RESTful & GraphQL APIs with Node.js.',
      'Implement authentication and authorization.',
      'Deploy full-stack apps to cloud platforms.',
    ],
    categorySlug: 'web-dev',
    instructorEmail: 'alex.rivera@careerone.dev',
    units: [
      {
        moduleNumber: 1,
        title: 'HTML, CSS & JavaScript Essentials',
        description: 'Build a strong foundation in the core technologies of the web.',
        imageUrl:
          'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop',
        status: UnitStatus.COMPLETED,
        isLocked: false,
        durationLabel: '3 Hours',
        chapters: [
          {
            position: 1,
            title: 'Chapter 1',
            description: 'Semantic HTML',
            durationLabel: '1h 00m',
            lessons: [
              { position: 1, title: 'Modern HTML5 Patterns', type: LessonType.LESSON, durationLabel: '60:00' },
            ],
          },
        ],
        resources: [],
      },
    ],
  },

  {
    slug: 'python-data-science',
    title: 'Python for Data Science & Machine Learning',
    shortName: 'Python DS',
    description:
      'Learn to analyze data and build predictive models using NumPy, Pandas, and Scikit-learn with real-world datasets.',
    imageUrl:
      'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?q=80&w=600&auto=format&fit=crop',
    level: CourseLevel.BEGINNER,
    badge: 'Popular',
    durationLabel: '32h',
    ratingAvg: 4.7,
    ratingCount: 9450,
    enrolledLabel: '22.1k',
    isFeatured: true,
    classmateCount: 1850,
    tags: ['Python', 'Pandas', 'ML'],
    totalUnits: 5,
    totalTopics: 26,
    totalLessons: 2,
    totalTests: 7,
    totalProjects: 10,
    learnings: [
      'Master Python data structures and libraries.',
      'Perform exploratory data analysis with Pandas.',
      'Build ML models with Scikit-learn.',
      'Visualize data with Matplotlib & Seaborn.',
    ],
    categorySlug: 'data-science',
    instructorEmail: 'maya.patel@careerone.dev',
    units: [
      {
        moduleNumber: 1,
        title: 'Python Fundamentals',
        description: 'Master the Python syntax and core programming concepts.',
        imageUrl:
          'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?q=80&w=800&auto=format&fit=crop',
        status: UnitStatus.COMPLETED,
        isLocked: false,
        durationLabel: '2.5 Hours',
        chapters: [
          {
            position: 1,
            title: 'Chapter 1',
            description: 'Python Syntax & Basics',
            durationLabel: '1h 30m',
            lessons: [
              { position: 1, title: 'Variables and Data Types', type: LessonType.LESSON, durationLabel: '45:00' },
              { position: 2, title: 'Control Flow in Python', type: LessonType.LESSON, durationLabel: '45:00' },
            ],
          },
        ],
        resources: [],
      },
    ],
  },

  {
    slug: 'uiux-design-principles',
    title: 'UI/UX Design Principles & Case Studies',
    shortName: 'UI/UX Design',
    description:
      'Learn user-centric design methodology and build high-fidelity wireframes using Figma.',
    imageUrl:
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=600&auto=format&fit=crop',
    level: CourseLevel.INTERMEDIATE,
    badge: 'Intermediate',
    durationLabel: '18h',
    ratingAvg: 4.8,
    ratingCount: 4210,
    enrolledLabel: '8.5k',
    classmateCount: 1540,
    tags: ['Figma', 'UI', 'UX'],
    totalUnits: 4,
    totalTopics: 18,
    totalTests: 4,
    totalProjects: 6,
    learnings: [
      'Conduct user research and usability testing.',
      'Design accessible and responsive user interfaces.',
      'Master Figma for prototyping.',
      'Implement design systems and component libraries.',
    ],
    categorySlug: 'design',
    instructorEmail: 'jamie.doe@careerone.dev',
    units: [],
  },

  // ─── Public catalog courses (catalog.data.ts) ──────────────────────────
  {
    slug: 'react-nextjs-masterclass-2026',
    title: 'Complete React & Next.js Masterclass 2026',
    description:
      'Build production-grade apps with React 19, Next.js 15, Server Components, and the App Router.',
    imageUrl:
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop',
    level: CourseLevel.INTERMEDIATE,
    badge: 'Bestseller',
    priceCents: 79900,
    originalPriceCents: 299900,
    durationLabel: '56h',
    ratingAvg: 4.9,
    ratingCount: 12840,
    enrolledLabel: '34.2k',
    isFeatured: true,
    tags: ['React', 'Next.js', 'TypeScript'],
    totalLessons: 84,
    categorySlug: 'web-dev',
    instructorEmail: 'alex.rivera@careerone.dev',
  },
  {
    slug: 'deep-learning-from-scratch',
    title: 'Deep Learning & Neural Networks from Scratch',
    description:
      'Master deep learning — build CNNs, RNNs, Transformers, and GANs from first principles with PyTorch.',
    imageUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=600&auto=format&fit=crop',
    level: CourseLevel.ADVANCED,
    badge: 'Advanced',
    priceCents: 99900,
    originalPriceCents: 349900,
    durationLabel: '48h',
    ratingAvg: 4.8,
    ratingCount: 7230,
    enrolledLabel: '18.7k',
    isFeatured: true,
    tags: ['PyTorch', 'Deep Learning', 'AI'],
    totalLessons: 68,
    categorySlug: 'ai-ml',
    instructorEmail: 'alan.turing@careerone.dev',
  },
  {
    slug: 'python-data-science-bootcamp',
    title: 'Python Data Science Bootcamp',
    description:
      'From zero to data scientist — NumPy, Pandas, Matplotlib, Scikit-learn, and real-world datasets.',
    imageUrl:
      'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?q=80&w=600&auto=format&fit=crop',
    level: CourseLevel.BEGINNER,
    badge: 'Popular',
    priceCents: 59900,
    originalPriceCents: 199900,
    durationLabel: '36h',
    ratingAvg: 4.7,
    ratingCount: 9450,
    enrolledLabel: '28.1k',
    isFeatured: true,
    tags: ['Python', 'Pandas', 'ML'],
    totalLessons: 52,
    categorySlug: 'data-science',
    instructorEmail: 'maya.patel@careerone.dev',
  },
  {
    slug: 'ethical-hacking-and-pentesting',
    title: 'Ethical Hacking & Penetration Testing',
    description:
      'Learn offensive security — network scanning, exploitation, privilege escalation, and bug bounty hunting.',
    imageUrl:
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop',
    level: CourseLevel.INTERMEDIATE,
    badge: 'New Course',
    priceCents: 89900,
    originalPriceCents: 249900,
    durationLabel: '42h',
    ratingAvg: 4.8,
    ratingCount: 5670,
    enrolledLabel: '15.3k',
    isFeatured: true,
    tags: ['Security', 'Linux', 'Networks'],
    totalLessons: 62,
    categorySlug: 'cybersecurity',
    instructorEmail: 'james.moriarty@careerone.dev',
  },
  {
    slug: 'figma-to-production',
    title: 'UI/UX Design — From Figma to Production',
    description:
      'Design stunning interfaces with Figma, build design systems, and hand-off pixel-perfect specs.',
    imageUrl:
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=600&auto=format&fit=crop',
    level: CourseLevel.BEGINNER,
    badge: 'Beginner',
    priceCents: 49900,
    originalPriceCents: 149900,
    durationLabel: '26h',
    ratingAvg: 4.6,
    ratingCount: 4210,
    enrolledLabel: '21.4k',
    tags: ['Figma', 'UI', 'UX'],
    totalLessons: 38,
    categorySlug: 'design',
    instructorEmail: 'sofia.nguyen@careerone.dev',
  },
  {
    slug: 'react-native-and-expo',
    title: 'React Native & Expo — Build Mobile Apps',
    description:
      'Ship iOS and Android apps from a single TypeScript codebase using React Native and Expo Router.',
    imageUrl:
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=600&auto=format&fit=crop',
    level: CourseLevel.INTERMEDIATE,
    badge: 'Intermediate',
    priceCents: 69900,
    originalPriceCents: 229900,
    durationLabel: '38h',
    ratingAvg: 4.7,
    ratingCount: 3890,
    enrolledLabel: '12.8k',
    tags: ['React Native', 'Expo', 'Mobile'],
    totalLessons: 56,
    categorySlug: 'mobile',
    instructorEmail: 'jake.morrison@careerone.dev',
  },
  {
    slug: 'fullstack-node-microservices',
    title: 'Full-Stack Node.js & Microservices',
    description:
      'Build scalable APIs with Node.js, Express, PostgreSQL, Redis, Docker, and Kubernetes.',
    imageUrl:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600&auto=format&fit=crop',
    level: CourseLevel.ADVANCED,
    badge: 'Advanced',
    priceCents: 89900,
    originalPriceCents: 319900,
    durationLabel: '50h',
    ratingAvg: 4.9,
    ratingCount: 6120,
    enrolledLabel: '16.5k',
    tags: ['Node.js', 'Docker', 'K8s'],
    totalLessons: 72,
    categorySlug: 'web-dev',
    instructorEmail: 'sarah.chen@careerone.dev',
  },
  {
    slug: 'product-management-growth',
    title: 'Product Management & Growth Strategy',
    description:
      'Learn product thinking, roadmapping, OKRs, A/B testing, and growth hacking for tech companies.',
    imageUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600&auto=format&fit=crop',
    level: CourseLevel.BEGINNER,
    badge: 'Popular',
    priceCents: 59900,
    originalPriceCents: 179900,
    durationLabel: '22h',
    ratingAvg: 4.5,
    ratingCount: 2340,
    enrolledLabel: '9.2k',
    tags: ['Product', 'Growth', 'Strategy'],
    totalLessons: 34,
    categorySlug: 'business',
    instructorEmail: 'lisa.park@careerone.dev',
  },
];
