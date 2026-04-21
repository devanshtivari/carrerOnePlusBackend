import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { softDeleteExtension } from './soft-delete.extension';

const buildExtendedClient = () => new PrismaClient().$extends(softDeleteExtension);

export type ExtendedPrismaClient = ReturnType<typeof buildExtendedClient>;

/**
 * Cast PrismaClient to the extended-client shape so the rest of the app sees
 * the same surface (`prisma.user.findMany`, `prisma.course.findMany`, …) plus
 * the soft-delete behaviour layered on top.
 *
 * Existing call-sites that operate on non-soft-delete models (User,
 * RefreshToken, OtpRecord) keep working unchanged because those models are
 * excluded from the extension's filter list.
 */
const PrismaServiceBase = PrismaClient as unknown as new () => ExtendedPrismaClient;

@Injectable()
export class PrismaService extends PrismaServiceBase implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
    const client = buildExtendedClient();
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        const value = (client as unknown as Record<string | symbol, unknown>)[prop as string];
        if (value !== undefined) {
          return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value;
        }
        return Reflect.get(target, prop, receiver);
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await (this as unknown as PrismaClient).$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await (this as unknown as PrismaClient).$disconnect();
  }
}
