import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttemptStatus, Prisma, QuestionType, TestStatus, UserRole } from '@prisma/client';

import { SubmitAnswerDto, SubmitAttemptDto } from '../dto/attempt.dto';
import { AttemptDetail, AttemptListItem, AttemptsRepository } from './attempts.repository';
import { QuestionsRepository } from './questions.repository';
import { TestsRepository } from './tests.repository';

interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class AttemptsService {
  constructor(
    private readonly repo: AttemptsRepository,
    private readonly testsRepo: TestsRepository,
    private readonly questionsRepo: QuestionsRepository,
  ) {}

  async start(testId: string, actor: ActorContext): Promise<AttemptDetail> {
    const test = await this.testsRepo.findById(testId);
    if (!test) throw new NotFoundException(`Test ${testId} not found`);

    if (test.status === TestStatus.ARCHIVED) {
      throw new BadRequestException('Cannot start an attempt for an archived test');
    }

    const existing = await this.repo.findActiveForUser(testId, actor.id);
    if (existing) return existing;

    const created = await this.repo.create({
      test: { connect: { id: testId } },
      user: { connect: { id: actor.id } },
      status: AttemptStatus.IN_PROGRESS,
      maxScore: test.totalMarks,
    });
    const detail = await this.repo.findById(created.id);
    if (!detail) throw new NotFoundException(`Attempt ${created.id} not found after create`);
    return detail;
  }

  async findById(id: string, actor: ActorContext): Promise<AttemptDetail> {
    const attempt = await this.repo.findById(id);
    if (!attempt) throw new NotFoundException(`Attempt ${id} not found`);
    this.assertCanAccess(attempt, actor);
    return attempt;
  }

  async listMine(actor: ActorContext): Promise<AttemptListItem[]> {
    return this.repo.listForUser(actor.id);
  }

  async listForTest(testId: string, actor: ActorContext): Promise<AttemptListItem[]> {
    const test = await this.testsRepo.findById(testId);
    if (!test) throw new NotFoundException(`Test ${testId} not found`);
    if (actor.role === UserRole.STUDENT) {
      return this.repo.listForUser(actor.id, { testId });
    }
    return this.repo.listForTest(testId);
  }

  async saveAnswer(
    id: string,
    dto: SubmitAnswerDto,
    actor: ActorContext,
  ): Promise<AttemptDetail> {
    const attempt = await this.repo.findById(id);
    if (!attempt) throw new NotFoundException(`Attempt ${id} not found`);
    this.assertOwner(attempt, actor);
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot modify a non-active attempt');
    }
    const question = await this.questionsRepo.findById(dto.questionId);
    if (!question) throw new NotFoundException(`Question ${dto.questionId} not found`);
    if (question.testId !== attempt.testId) {
      throw new BadRequestException('Question does not belong to this attempt’s test');
    }

    await this.repo.upsertAnswer(id, dto.questionId, {
      selectedLabel: dto.selectedLabel ?? null,
      textAnswer: dto.textAnswer ?? null,
    });
    const detail = await this.repo.findById(id);
    if (!detail) throw new NotFoundException(`Attempt ${id} not found after save`);
    return detail;
  }

  async submit(
    id: string,
    dto: SubmitAttemptDto,
    actor: ActorContext,
  ): Promise<AttemptDetail> {
    const attempt = await this.repo.findById(id);
    if (!attempt) throw new NotFoundException(`Attempt ${id} not found`);
    this.assertOwner(attempt, actor);
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Attempt is already submitted');
    }

    const questions = await this.questionsRepo.findByTest(attempt.testId);
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    const answers = dto.answers ?? [];
    for (const ans of answers) {
      const q = questionMap.get(ans.questionId);
      if (!q) {
        throw new BadRequestException(`Question ${ans.questionId} is not part of this test`);
      }
      const grading = this.gradeAnswer(q, ans);
      await this.repo.upsertAnswer(id, ans.questionId, {
        selectedLabel: ans.selectedLabel ?? null,
        textAnswer: ans.textAnswer ?? null,
        ...grading,
      });
    }

    // Auto-grade any remaining MCQ-only attempts using whatever was already saved.
    const fresh = await this.repo.findById(id);
    let score = 0;
    let allAutoGradable = true;
    for (const a of fresh?.answers ?? []) {
      if (a.awardedMarks !== null && a.awardedMarks !== undefined) {
        score += a.awardedMarks;
      } else {
        allAutoGradable = false;
      }
    }
    // Account for unanswered TEXT questions that need manual grading.
    const hasManualGap = questions.some(
      (q) => q.type === QuestionType.TEXT && !(fresh?.answers ?? []).some((a) => a.questionId === q.id && a.awardedMarks !== null),
    );
    const fullyAuto = allAutoGradable && !hasManualGap;

    const update: Prisma.TestAttemptUpdateInput = {
      status: fullyAuto ? AttemptStatus.GRADED : AttemptStatus.SUBMITTED,
      submittedAt: new Date(),
      ...(fullyAuto && { gradedAt: new Date(), score }),
    };
    await this.repo.update(id, update);
    const detail = await this.repo.findById(id);
    if (!detail) throw new NotFoundException(`Attempt ${id} not found after submit`);
    return detail;
  }

  private gradeAnswer(
    question: { id: string; type: QuestionType; marks: number; options: { label: string; isCorrect: boolean }[] },
    ans: SubmitAnswerDto,
  ): { awardedMarks?: number | null; isCorrect?: boolean | null } {
    if (question.type === QuestionType.MCQ) {
      if (!ans.selectedLabel) return { awardedMarks: 0, isCorrect: false };
      const opt = question.options.find((o) => o.label === ans.selectedLabel);
      const isCorrect = !!opt?.isCorrect;
      return { awardedMarks: isCorrect ? question.marks : 0, isCorrect };
    }
    return { awardedMarks: null, isCorrect: null };
  }

  private assertCanAccess(
    attempt: { userId: string },
    actor: ActorContext,
  ): void {
    if (actor.role === UserRole.ADMIN || actor.role === UserRole.INSTRUCTOR) return;
    if (attempt.userId !== actor.id) {
      throw new ForbiddenException('You do not have access to this attempt');
    }
  }

  private assertOwner(attempt: { userId: string }, actor: ActorContext): void {
    if (attempt.userId !== actor.id) {
      throw new ForbiddenException('Only the attempt owner can modify it');
    }
  }
}
