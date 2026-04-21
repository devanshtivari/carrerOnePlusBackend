import { CalendarEventType } from '@prisma/client';

import { SeederContext } from './index';

interface EventSeed {
  title: string;
  type: CalendarEventType;
  startsAt: Date;
  endsAt?: Date;
  location?: string;
  ownerEmail?: string;
}

function daysFromNow(days: number, hour = 9): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

const eventsSeedData: EventSeed[] = [
  {
    title: 'Science Fair 2026',
    type: CalendarEventType.EVENT,
    startsAt: daysFromNow(7, 9),
    endsAt: daysFromNow(7, 17),
    location: 'Main Hall',
    ownerEmail: 'sarah.miller@careerone.dev',
  },
  {
    title: 'PTA General Meet',
    type: CalendarEventType.MEETING,
    startsAt: daysFromNow(10, 14),
    endsAt: daysFromNow(10, 16),
    location: 'Virtual',
    ownerEmail: 'sarah.miller@careerone.dev',
  },
  {
    title: 'Lab Safety Drill',
    type: CalendarEventType.ACTIVITY,
    startsAt: daysFromNow(15, 9),
    endsAt: daysFromNow(15, 17),
    location: 'Campus',
    ownerEmail: 'david.chen@careerone.dev',
  },
];

export async function seedCalendarEvents({ prisma }: SeederContext): Promise<void> {
  for (const data of eventsSeedData) {
    const owner = data.ownerEmail
      ? await prisma.user.findUnique({ where: { email: data.ownerEmail } })
      : null;

    const existing = await prisma.calendarEvent.findFirst({
      where: { title: data.title, deletedAt: null },
    });

    const payload = {
      title: data.title,
      type: data.type,
      startsAt: data.startsAt,
      endsAt: data.endsAt ?? null,
      location: data.location ?? null,
      ownerId: owner?.id ?? null,
    };

    if (existing) {
      await prisma.calendarEvent.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.calendarEvent.create({ data: payload });
    }
  }
}
