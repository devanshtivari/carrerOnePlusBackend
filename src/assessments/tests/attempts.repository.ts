import { Injectable } from '@nestjs/common';
import { AttemptAnswer, AttemptStatus, Prisma, TestAttempt } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

const attemptSelect = {
  id: true,
  testId: true,
  userId: true,
  status: true,
  startedAt: true,
  submittedAt: true,
  gradedAt: true,
  score: true,
  maxScore: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TestAttemptSelect;

const attemptDetailSelect = {
  ...attemptSelect,
  answers: {
    select: {
      id: true,
      questionId: true,
      selectedLabel: true,
      textAnswer: true,
      awardedMarks: true,
      isCorrect: true,
    },
  },
  test: { select: { id: true, code: true, title: true, type: true, durationMinutes: true } },
} satisfies Prisma.TestAttemptSelect;

export type AttemptListItem = Prisma.TestAttemptGetPayload<{ select: typeof attemptSelect }>;
export type AttemptDetail = Prisma.TestAttemptGetPayload<{ select: typeof attemptDetailSelect }>;

@Injectable()
export class AttemptsRepository {
  constructor(private readonly prisma: PrismaService) {}

  readonly listSelect = attemptSelect;
  readonly detailSelect = attemptDetailSelect;

  async create(data: Prisma.TestAttemptCreateInput): Promise<TestAttempt> {
    return this.prisma.testAttempt.create({ data });
  }

  async findById(id: string): Promise<AttemptDetail | null> {
    return this.prisma.testAttempt.findUnique({
      where: { id },
      select: attemptDetailSelect,
    });
  }

  async findActiveForUser(testId: string, userId: string): Promise<AttemptDetail | null> {
    return this.prisma.testAttempt.findFirst({
      where: { testId, userId, status: AttemptStatus.IN_PROGRESS },
      select: attemptDetailSelect,
    });
  }

  async listForUser(
    userId: string,
    where: Prisma.TestAttemptWhereInput = {},
  ): Promise<AttemptListItem[]> {
    return this.prisma.testAttempt.findMany({
      where: { ...where, userId },
      orderBy: { createdAt: 'desc' },
      select: attemptSelect,
    });
  }

  async listForTest(testId: string): Promise<AttemptListItem[]> {
    return this.prisma.testAttempt.findMany({
      where: { testId },
      orderBy: { createdAt: 'desc' },
      select: attemptSelect,
    });
  }

  async update(id: string, data: Prisma.TestAttemptUpdateInput): Promise<TestAttempt> {
    return this.prisma.testAttempt.update({ where: { id }, data });
  }

  async upsertAnswer(
    attemptId: string,
    questionId: string,
    data: {
      selectedLabel?: string | null;
      textAnswer?: string | null;
      awardedMarks?: number | null;
      isCorrect?: boolean | null;
    },
  ): Promise<AttemptAnswer> {
    return this.prisma.attemptAnswer.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      create: {
        attemptId,
        questionId,
        selectedLabel: data.selectedLabel ?? null,
        textAnswer: data.textAnswer ?? null,
        awardedMarks: data.awardedMarks ?? null,
        isCorrect: data.isCorrect ?? null,
      },
      update: {
        selectedLabel: data.selectedLabel ?? null,
        textAnswer: data.textAnswer ?? null,
        ...(data.awardedMarks !== undefined && { awardedMarks: data.awardedMarks }),
        ...(data.isCorrect !== undefined && { isCorrect: data.isCorrect }),
      },
    });
  }

  async deleteForAttempt(attemptId: string): Promise<void> {
    await this.prisma.attemptAnswer.deleteMany({ where: { attemptId } });
  }
}
