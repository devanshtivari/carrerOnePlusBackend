import { Injectable } from '@nestjs/common';
import { Prisma, Question } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

const questionSelect = {
  id: true,
  testId: true,
  type: true,
  prompt: true,
  marks: true,
  position: true,
  createdAt: true,
  updatedAt: true,
  options: {
    select: { id: true, label: true, text: true, isCorrect: true, position: true },
    orderBy: { position: 'asc' as const },
  },
} satisfies Prisma.QuestionSelect;

export type QuestionDetail = Prisma.QuestionGetPayload<{ select: typeof questionSelect }>;

@Injectable()
export class QuestionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  readonly defaultSelect = questionSelect;

  async findById(id: string): Promise<QuestionDetail | null> {
    return this.prisma.question.findUnique({ where: { id }, select: questionSelect });
  }

  async findByTest(testId: string): Promise<QuestionDetail[]> {
    return this.prisma.question.findMany({
      where: { testId },
      orderBy: { position: 'asc' },
      select: questionSelect,
    });
  }

  async findByTestAndPosition(
    testId: string,
    position: number,
  ): Promise<{ id: string } | null> {
    return this.prisma.question.findFirst({
      where: { testId, position },
      select: { id: true },
    });
  }

  async create(data: Prisma.QuestionCreateInput): Promise<Question> {
    return this.prisma.question.create({ data });
  }

  async update(id: string, data: Prisma.QuestionUpdateInput): Promise<Question> {
    return this.prisma.question.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Question> {
    return this.prisma.question.delete({ where: { id } });
  }

  async replaceOptions(
    questionId: string,
    options: Array<{ label: string; text: string; isCorrect?: boolean; position?: number }>,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.questionOption.deleteMany({ where: { questionId } }),
      ...(options.length
        ? [
            this.prisma.questionOption.createMany({
              data: options.map((o, idx) => ({
                questionId,
                label: o.label,
                text: o.text,
                isCorrect: o.isCorrect ?? false,
                position: o.position ?? idx,
              })),
            }),
          ]
        : []),
    ]);
  }
}
