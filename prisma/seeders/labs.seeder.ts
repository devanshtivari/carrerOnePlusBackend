import { LabRuntimeStatus } from '@prisma/client';

import { SeederContext } from './index';

interface LabSeed {
  name: string;
  status: LabRuntimeStatus;
  uptimeNote?: string;
  activeUsers?: number;
}

const labsSeedData: LabSeed[] = [
  {
    name: 'JavaScript Sandbox',
    status: LabRuntimeStatus.AVAILABLE,
    uptimeNote: 'All systems operational',
    activeUsers: 32,
  },
  {
    name: 'Python ML Lab',
    status: LabRuntimeStatus.HIGH_TRAFFIC,
    uptimeNote: 'High demand, response may be slower',
    activeUsers: 78,
  },
  {
    name: 'React Playground',
    status: LabRuntimeStatus.AVAILABLE,
    activeUsers: 21,
  },
  {
    name: 'Robotics Simulator',
    status: LabRuntimeStatus.MAINTENANCE,
    uptimeNote: 'Scheduled maintenance until 18:00 UTC',
    activeUsers: 0,
  },
  {
    name: 'SQL Sandbox',
    status: LabRuntimeStatus.AVAILABLE,
    activeUsers: 11,
  },
];

export async function seedLabs({ prisma }: SeederContext): Promise<void> {
  for (const data of labsSeedData) {
    const existing = await prisma.lab.findFirst({ where: { name: data.name, deletedAt: null } });
    if (existing) {
      await prisma.lab.update({
        where: { id: existing.id },
        data: {
          status: data.status,
          uptimeNote: data.uptimeNote ?? null,
          activeUsers: data.activeUsers ?? 0,
        },
      });
    } else {
      await prisma.lab.create({
        data: {
          name: data.name,
          status: data.status,
          uptimeNote: data.uptimeNote ?? null,
          activeUsers: data.activeUsers ?? 0,
        },
      });
    }
  }
}
