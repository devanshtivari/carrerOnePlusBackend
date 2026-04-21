import { Prisma } from '@prisma/client';

/**
 * Models that participate in soft-delete (have a `deletedAt DateTime?` column).
 *
 * Keep this list in sync with prisma/schema.prisma. Models *not* listed here
 * (e.g. User, RefreshToken, OtpRecord, LessonCompletion, AttemptAnswer,
 * QuestionOption, LeaderboardEntry, GrowthSnapshot, TestGuideline) are
 * unaffected and pass through Prisma operations unchanged.
 */
const SOFT_DELETE_MODELS = new Set<string>([
  'Category',
  'Course',
  'Unit',
  'Chapter',
  'Lesson',
  'Resource',
  'Enrollment',
  'Test',
  'Question',
  'TestAttempt',
  'Project',
  'ProjectSubmission',
  'Assignment',
  'AssignmentSubmission',
  'Class',
  'ClassMembership',
  'SubjectScore',
  'Notification',
  'Announcement',
  'Feedback',
  'Alert',
  'CalendarEvent',
  'Lab',
  'Report',
]);

const MULTI_ROW_READ_OPS = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
]);

const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);

/**
 * Adds `deletedAt: null` to a where clause unless the caller has already
 * filtered explicitly on `deletedAt`. Preserves any other conditions.
 */
function applyDeletedAtFilter(where: unknown): Record<string, unknown> {
  if (where && typeof where === 'object' && 'deletedAt' in (where as object)) {
    return where as Record<string, unknown>;
  }
  return { ...((where as Record<string, unknown>) ?? {}), deletedAt: null };
}

/**
 * Extension flags supported on top of standard Prisma args:
 *   - includeDeleted: true  → bypass soft-delete filter on reads/updates
 *   - hardDelete: true      → physically remove the row(s) on delete()/deleteMany()
 *
 * Both flags are stripped before forwarding to Prisma.
 */
interface SoftDeleteFlags {
  includeDeleted?: boolean;
  hardDelete?: boolean;
}

/**
 * Soft-delete client extension.
 *
 * - Read ops on listed models auto-exclude rows where `deletedAt IS NOT NULL`.
 * - `delete` / `deleteMany` on listed models become `update` / `updateMany`
 *   that set `deletedAt = now()`.
 * - `findUnique` / `findUniqueOrThrow` are filtered post-fetch to avoid
 *   Prisma's "non-unique field in unique where" error.
 * - Pass `{ includeDeleted: true }` or `{ hardDelete: true }` to opt out.
 */
export const softDeleteExtension = Prisma.defineExtension((client) =>
  client.$extends({
    name: 'soft-delete',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !SOFT_DELETE_MODELS.has(model)) {
            return query(args as never);
          }

          const a = (args ?? {}) as Record<string, unknown> & SoftDeleteFlags;
          const includeDeleted = a.includeDeleted === true;
          const hardDelete = a.hardDelete === true;

          if ('includeDeleted' in a) delete a.includeDeleted;
          if ('hardDelete' in a) delete a.hardDelete;

          if (operation === 'delete') {
            if (hardDelete) return query(a as never);
            const accessor = (client as unknown as Record<string, { update: (a: unknown) => Promise<unknown> }>)[
              lowerFirst(model)
            ];
            return accessor.update({
              where: a.where,
              data: { deletedAt: new Date() },
              ...(a.select ? { select: a.select } : {}),
              ...(a.include ? { include: a.include } : {}),
            }) as never;
          }

          if (operation === 'deleteMany') {
            if (hardDelete) return query(a as never);
            const accessor = (client as unknown as Record<string, { updateMany: (a: unknown) => Promise<unknown> }>)[
              lowerFirst(model)
            ];
            return accessor.updateMany({
              where: applyDeletedAtFilter(a.where),
              data: { deletedAt: new Date() },
            }) as never;
          }

          if (MULTI_ROW_READ_OPS.has(operation) && !includeDeleted) {
            a.where = applyDeletedAtFilter(a.where);
            return query(a as never);
          }

          if ((operation === 'findUnique' || operation === 'findUniqueOrThrow') && !includeDeleted) {
            const result = (await query(a as never)) as { deletedAt?: Date | null } | null;
            if (result && result.deletedAt) {
              if (operation === 'findUniqueOrThrow') {
                throw new Error(`No ${model} found (soft-deleted)`);
              }
              return null as never;
            }
            return result as never;
          }

          // update, updateMany, upsert, create, createMany, etc. → unchanged.
          // Callers updating soft-deleted rows is intentional (allows resurrect).
          return query(a as never);
        },
      },
    },
  }),
);
