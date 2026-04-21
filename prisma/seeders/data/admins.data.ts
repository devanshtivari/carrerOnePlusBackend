/**
 * Admin seed data. These users have the ADMIN role, which grants access to
 * teacher-level routes in the frontend (Sidebar renders teacher nav for both
 * INSTRUCTOR and ADMIN). Passwords are seeded via `admins.seeder.ts`.
 */
export interface AdminSeed {
  email: string;
  fullName: string;
  initials: string;
  bio?: string;
}

export const adminsSeedData: AdminSeed[] = [
  {
    email: 'admin@careerone.dev',
    fullName: 'Platform Admin',
    initials: 'PA',
    bio: 'Root administrator for CareerOne Academy.',
  },
];
