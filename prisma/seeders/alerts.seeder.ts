import { AlertPriority } from '@prisma/client';

import { SeederContext } from './index';

interface AlertSeed {
  title: string;
  message: string;
  priority: AlertPriority;
  studentsAffected?: number;
  timeInfo?: string;
}

const alertsSeedData: AlertSeed[] = [
  {
    title: 'Low Academic Performance',
    message: 'Students in Grade 6 (Sec B) dropped below 40% in recent Science mid-terms.',
    priority: AlertPriority.CRITICAL,
    studentsAffected: 12,
  },
  {
    title: 'Lab Safety Maintenance',
    message: 'Annual safety calibration for Chemistry Lab ventilation is past due by 4 days.',
    priority: AlertPriority.HIGH,
    timeInfo: '4 days overdue',
  },
  {
    title: 'Attendance Drop',
    message: 'Class 9 (Sec A) attendance dropped 8% week over week.',
    priority: AlertPriority.MEDIUM,
    studentsAffected: 28,
  },
];

export async function seedAlerts({ prisma }: SeederContext): Promise<void> {
  for (const data of alertsSeedData) {
    const existing = await prisma.alert.findFirst({
      where: { title: data.title, deletedAt: null },
    });
    if (existing) {
      await prisma.alert.update({
        where: { id: existing.id },
        data: {
          message: data.message,
          priority: data.priority,
          studentsAffected: data.studentsAffected ?? null,
          timeInfo: data.timeInfo ?? null,
        },
      });
    } else {
      await prisma.alert.create({
        data: {
          title: data.title,
          message: data.message,
          priority: data.priority,
          studentsAffected: data.studentsAffected ?? null,
          timeInfo: data.timeInfo ?? null,
        },
      });
    }
  }
}
