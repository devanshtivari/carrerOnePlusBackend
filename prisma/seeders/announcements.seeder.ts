import { announcementsSeedData } from './data/announcements.data';
import { SeederContext } from './index';

export async function seedAnnouncements({ prisma }: SeederContext): Promise<void> {
  for (const data of announcementsSeedData) {
    const author = data.authorEmail
      ? await prisma.user.findUnique({ where: { email: data.authorEmail } })
      : null;

    const existing = await prisma.announcement.findFirst({
      where: { title: data.title, deletedAt: null },
    });

    const payload = {
      title: data.title,
      description: data.description ?? null,
      audience: data.audience,
      tag: data.tag ?? null,
      primaryCtaText: data.primaryCtaText ?? null,
      primaryCtaUrl: data.primaryCtaUrl ?? null,
      secondaryCtaText: data.secondaryCtaText ?? null,
      secondaryCtaUrl: data.secondaryCtaUrl ?? null,
      sponsorName: data.sponsorName ?? null,
      imageUrl: data.imageUrl ?? null,
      themeColor: data.themeColor ?? null,
      isActive: data.isActive ?? true,
      authorId: author?.id ?? null,
    };

    if (existing) {
      await prisma.announcement.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.announcement.create({ data: payload });
    }
  }
}
