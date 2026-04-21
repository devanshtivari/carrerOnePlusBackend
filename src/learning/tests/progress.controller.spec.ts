import { Test, TestingModule } from '@nestjs/testing';
import { User, UserRole } from '@prisma/client';

import { ProgressController } from '../progress/progress.controller';
import { ProgressService } from '../progress/progress.service';

describe('ProgressController', () => {
  let controller: ProgressController;
  const service = {
    markLessonComplete: jest.fn(),
    unmarkLessonComplete: jest.fn(),
    getCourseProgress: jest.fn(),
    getCourseProgressForUser: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ProgressController],
      providers: [{ provide: ProgressService, useValue: service }],
    }).compile();
    controller = moduleRef.get(ProgressController);
  });

  afterEach(() => jest.clearAllMocks());

  const user = { id: 'me', role: UserRole.STUDENT } as User;

  it('mark delegates', async () => {
    service.markLessonComplete.mockResolvedValue({ progressPercent: 50 });
    await controller.markLesson({ lessonId: 'l1' } as any, user);
    expect(service.markLessonComplete).toHaveBeenCalledWith('l1', { id: 'me', role: UserRole.STUDENT });
  });
  it('unmark delegates', async () => {
    service.unmarkLessonComplete.mockResolvedValue({ progressPercent: 0 });
    await controller.unmarkLesson('l1', user);
    expect(service.unmarkLessonComplete).toHaveBeenCalledWith('l1', { id: 'me', role: UserRole.STUDENT });
  });
  it('getCourseProgress delegates', async () => {
    service.getCourseProgress.mockResolvedValue({ progressPercent: 50 });
    await controller.getCourseProgress('c1', user);
    expect(service.getCourseProgress).toHaveBeenCalledWith('c1', { id: 'me', role: UserRole.STUDENT });
  });
  it('getUserCourseProgress delegates', async () => {
    service.getCourseProgressForUser.mockResolvedValue({ progressPercent: 100 });
    await controller.getUserCourseProgress('u1', 'c1', user);
    expect(service.getCourseProgressForUser).toHaveBeenCalledWith('u1', 'c1', {
      id: 'me',
      role: UserRole.STUDENT,
    });
  });
});
