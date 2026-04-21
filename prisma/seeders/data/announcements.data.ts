import { AnnouncementAudience } from '@prisma/client';

export interface AnnouncementSeed {
  title: string;
  description?: string;
  audience: AnnouncementAudience;
  tag?: string;
  primaryCtaText?: string;
  primaryCtaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  sponsorName?: string;
  imageUrl?: string;
  themeColor?: string;
  isActive?: boolean;
  authorEmail?: string;
}

export const announcementsSeedData: AnnouncementSeed[] = [
  {
    title: 'Global Student Hackathon 2024: Innovate for Earth',
    description: 'Join thousands of students worldwide to solve climate challenges.',
    tag: 'Major Announcement',
    audience: AnnouncementAudience.ALL,
    primaryCtaText: 'Register Now',
    primaryCtaUrl: '/events/hackathon-2024',
    secondaryCtaText: 'Learn More',
    secondaryCtaUrl: '/events/hackathon-2024/about',
    sponsorName: 'GlobalTech',
    imageUrl:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=500&auto=format&fit=crop',
    themeColor: '#34D399',
  },
  {
    title: 'Advanced System Design Masterclass',
    description: 'Learn how to build scalable systems from industry experts.',
    tag: 'New Course',
    audience: AnnouncementAudience.STUDENT,
    primaryCtaText: 'View Course',
    primaryCtaUrl: '/student/courses/system-design',
    secondaryCtaText: 'Syllabus',
    secondaryCtaUrl: '/student/courses/system-design/syllabus',
    sponsorName: 'SystemDesign Pro',
    imageUrl:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=500&auto=format&fit=crop',
    themeColor: '#FBBF24',
  },
  {
    title: 'Graph Algorithms Challenge #42',
    description:
      'Test your skills against the community and win exclusive profile badges.',
    tag: 'Weekly Challenge',
    audience: AnnouncementAudience.STUDENT,
    primaryCtaText: 'Compete Now',
    primaryCtaUrl: '/student/challenges/42',
    secondaryCtaText: 'Leaderboard',
    secondaryCtaUrl: '/student/leaderboard',
    sponsorName: 'AlgoMasters',
    imageUrl:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=500&auto=format&fit=crop',
    themeColor: '#22D3EE',
  },
];
