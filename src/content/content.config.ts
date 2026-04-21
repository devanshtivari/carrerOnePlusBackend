/**
 * Static UI content (in-memory typed config).
 * Mirrors the data files in `frontend/src/components/shared/*` and
 * `frontend/src/components/features/landing/data.ts`.
 *
 * Editing copy/links here updates the production frontend without DB writes.
 */

export interface NavLinkContent {
  label: string;
  href: string;
}

export interface SidebarLinkContent extends NavLinkContent {
  iconName: string;
}

export interface FooterColumnContent {
  title: string;
  links: NavLinkContent[];
}

export interface LandingFeatureContent {
  iconName: string;
  title: string;
  description: string;
}

export interface LandingJourneyStepContent {
  num: string;
  title: string;
  description: string;
}

export interface LandingCollabContent {
  title: string;
  description: string;
}

export interface SiteContent {
  brand: { name: string; tagline: string };
  navLinks: NavLinkContent[];
  studentNavItems: SidebarLinkContent[];
  teacherNavItems: SidebarLinkContent[];
  footer: { columns: FooterColumnContent[]; legal: string };
  landing: {
    features: LandingFeatureContent[];
    journey: LandingJourneyStepContent[];
    collaboration: LandingCollabContent[];
  };
}

export const siteContent: SiteContent = {
  brand: {
    name: 'Career1Plus',
    tagline: 'AI-Powered Learning for Tomorrow’s Builders',
  },
  navLinks: [
    { label: 'Courses', href: '/#courses' },
    { label: 'Schools', href: '/#schools' },
    { label: 'About', href: '/#about' },
    { label: 'Contact', href: '/#contact' },
  ],
  studentNavItems: [
    { label: 'Dashboard', href: '/student', iconName: 'LayoutDashboard' },
    { label: 'Leaderboard', href: '/student/leaderboard', iconName: 'Trophy' },
    { label: 'Courses', href: '/student/courses', iconName: 'BookOpen' },
    { label: 'Project Submission', href: '/student/project-submission', iconName: 'FolderUp' },
    { label: 'Test Section', href: '/student/tests', iconName: 'ClipboardCheck' },
    { label: 'My Results', href: '/student/results', iconName: 'GraduationCap' },
    { label: 'Code Playground', href: '/student/code-playground', iconName: 'Code2' },
    { label: 'AI Code Tutor', href: '/student/ai-assistant', iconName: 'Bot' },
    { label: 'Community', href: '/student/community', iconName: 'Users' },
    { label: 'Notifications', href: '/student/notifications', iconName: 'BellRing' },
  ],
  teacherNavItems: [
    { label: 'Dashboard', href: '/teacher', iconName: 'LayoutDashboard' },
    { label: 'Student Performance', href: '/teacher/performance', iconName: 'LineChart' },
    { label: 'Projects & Lab', href: '/teacher/projects', iconName: 'FolderUp' },
    { label: 'Reports', href: '/teacher/reports', iconName: 'FileText' },
    { label: 'Alerts', href: '/teacher/alerts', iconName: 'BellRing' },
    { label: 'Leaderboard', href: '/teacher/leaderboard', iconName: 'Trophy' },
    { label: 'Notifications', href: '/teacher/notifications', iconName: 'BellRing' },
  ],
  footer: {
    columns: [
      {
        title: 'Explore',
        links: [
          { label: 'Courses Catalog', href: '/learning' },
          { label: 'Student Projects', href: '/projects' },
          { label: 'Rankings', href: '/leaderboard' },
          { label: 'Certificates', href: '/certificates' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About Us', href: '/about' },
          { label: 'Our Team', href: '/team' },
          { label: 'Careers', href: '/careers' },
          { label: 'Contact', href: '/contact' },
        ],
      },
      {
        title: 'Support',
        links: [
          { label: 'Help Center', href: '/support' },
          { label: 'Privacy Policy', href: '/privacy' },
          { label: 'Terms of Service', href: '/terms' },
        ],
      },
    ],
    legal: '© Career1Plus. All rights reserved.',
  },
  landing: {
    features: [
      {
        iconName: 'BookOpen',
        title: 'Structured Learning',
        description:
          'Curated paths for every grade level, from fundamentals to advanced AI concepts.',
      },
      {
        iconName: 'FolderGit2',
        title: 'Project Submission',
        description: 'Build and showcase a real-world hands-on project portfolio to the world.',
      },
      {
        iconName: 'Trophy',
        title: 'Ranking System',
        description: 'Gamified environment where you compete and climb the national leaderboard.',
      },
      {
        iconName: 'ShieldCheck',
        title: 'Secure Exams',
        description: 'Integrity-first assessment modules with secure code-based environments.',
      },
    ],
    journey: [
      { num: '1', title: 'Sign Up', description: 'Create your unique student profile' },
      { num: '2', title: 'Choose Course', description: 'Pick a track from Class 6-12' },
      { num: '3', title: 'Learn & Practice', description: 'Interactive lessons and coding' },
      { num: '4', title: 'Submit Projects', description: 'Build your tech portfolio' },
    ],
    collaboration: [
      {
        title: 'Integrated LMS',
        description: 'Seamlessly manage student batches and progress tracking.',
      },
      {
        title: 'Teacher Training',
        description: 'Workshops for educators to stay ahead of the tech curve.',
      },
      { title: 'Innovation Labs', description: 'Setup state-of-the-art tech labs in your campus.' },
    ],
  },
};
