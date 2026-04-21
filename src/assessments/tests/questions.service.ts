import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, QuestionType } from '@prisma/client';

import { CreateQuestionDto, UpdateQuestionDto } from '../dto/question.dto';
import { QuestionsRepository, QuestionDetail } from './questions.repository';
import { TestsRepository } from './tests.repository';

@Injectable()
export class QuestionsService {
  constructor(
    private readonly repo: QuestionsRepository,
    private readonly testsRepo: TestsRepository,
  ) {}

  async listForTest(testId: string): Promise<QuestionDetail[]> {
    const test = await this.testsRepo.findById(testId);
    if (!test) throw new NotFoundException(`Test ${testId} not found`);
    return this.repo.findByTest(testId);
  }

  async findById(id: string): Promise<QuestionDetail> {
    const q = await this.repo.findById(id);
    if (!q) throw new NotFoundException(`Question ${id} not found`);
    return q;
  }

  async create(testId: string, dto: CreateQuestionDto): Promise<QuestionDetail> {
    const test = await this.testsRepo.findById(testId);
    if (!test) throw new NotFoundException(`Test ${testId} not found`);

    const type = dto.type ?? QuestionType.MCQ;
    const position = dto.position ?? 0;

    if (position) {
      const conflict = await this.repo.findByTestAndPosition(testId, position);
      if (conflict) {
        throw new ConflictException(`Question at position ${position} already exists`);
      }
    }

    if (type === QuestionType.MCQ) {
      if (!dto.options || dto.options.length < 2) {
        throw new BadRequestException('MCQ questions require at least 2 options');
      }
    }

    const data: Prisma.QuestionCreateInput = {
      test: { connect: { id: testId } },
      type,
      prompt: dto.prompt,
      marks: dto.marks ?? 0,
      position,
      ...(dto.options &&
        dto.options.length && {
          options: {
            create: dto.options.map((o, idx) => ({
              label: o.label,
              text: o.text,
              isCorrect: o.isCorrect ?? false,
              position: o.position ?? idx,
            })),
          },
        }),
    };

    const created = await this.repo.create(data);
    await this.testsRepo.refreshTotals(testId);
    const detail = await this.repo.findById(created.id);
    if (!detail) throw new NotFoundException(`Question ${created.id} not found after create`);
    return detail;
  }

  async update(id: string, dto: UpdateQuestionDto): Promise<QuestionDetail> {
    const question = await this.repo.findById(id);
    if (!question) throw new NotFoundException(`Question ${id} not found`);

    if (dto.position !== undefined && dto.position !== question.position) {
      const conflict = await this.repo.findByTestAndPosition(question.testId, dto.position);
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`Question at position ${dto.position} already exists`);
      }
    }

    const data: Prisma.QuestionUpdateInput = {
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.prompt !== undefined && { prompt: dto.prompt }),
      ...(dto.marks !== undefined && { marks: dto.marks }),
      ...(dto.position !== undefined && { position: dto.position }),
    };
    await this.repo.update(id, data);

    if (dto.options !== undefined) {
      await this.repo.replaceOptions(id, dto.options);
    }

    await this.testsRepo.refreshTotals(question.testId);
    const detail = await this.repo.findById(id);
    if (!detail) throw new NotFoundException(`Question ${id} not found after update`);
    return detail;
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    const q = await this.repo.findById(id);
    if (!q) throw new NotFoundException(`Question ${id} not found`);
    await this.repo.softDelete(id);
    await this.testsRepo.refreshTotals(q.testId);
    return { id, deleted: true };
  }
}
