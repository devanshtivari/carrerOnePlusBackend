/**
 * Catalog category seed data — sourced from
 * frontend/src/components/features/courses/CourseCatalog/data.ts
 *
 * `iconName` matches the lucide-react icon component name so the frontend
 * can render the correct icon without leaking icon imports into the API layer.
 *
 * The "All" pseudo-category from the frontend is intentionally omitted —
 * it's a UI filter, not a real category.
 */
export interface CategorySeed {
  slug: string;
  label: string;
  iconName?: string | null;
  position: number;
}

export const categoriesSeedData: CategorySeed[] = [
  { slug: 'web-dev', label: 'Web Dev', iconName: 'Code2', position: 1 },
  { slug: 'ai-ml', label: 'AI & ML', iconName: 'Brain', position: 2 },
  { slug: 'data-science', label: 'Data Science', iconName: 'Database', position: 3 },
  { slug: 'cybersecurity', label: 'Cybersecurity', iconName: 'Shield', position: 4 },
  { slug: 'design', label: 'Design', iconName: 'Palette', position: 5 },
  { slug: 'mobile', label: 'Mobile', iconName: 'Smartphone', position: 6 },
  { slug: 'business', label: 'Business', iconName: 'BarChart3', position: 7 },
  { slug: 'robotics', label: 'Robotics', iconName: 'Bot', position: 8 },
];
