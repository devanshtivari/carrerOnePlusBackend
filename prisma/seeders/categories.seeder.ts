import { SeederContext } from './index';
import { categoriesSeedData } from './data/categories.data';

export async function seedCategories({ prisma }: SeederContext): Promise<void> {
  for (const c of categoriesSeedData) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {
        label: c.label,
        iconName: c.iconName,
        position: c.position,
        deletedAt: null,
      },
      create: c,
    });
  }
}
