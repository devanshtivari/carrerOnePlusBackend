import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardScope } from '@prisma/client';

import { LeaderboardRepository } from '../leaderboard/leaderboard.repository';
import { LeaderboardService } from '../leaderboard/leaderboard.service';

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  const repo = {
    listScoped: jest.fn(),
    findUserEntry: jest.fn(),
    listUsersForScope: jest.fn(),
    getAggregatesForUsers: jest.fn(),
    replaceScope: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        { provide: LeaderboardRepository, useValue: repo },
      ],
    }).compile();
    service = moduleRef.get(LeaderboardService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('requires scopeKey for CLASS', async () => {
      await expect(
        service.list({ scope: LeaderboardScope.CLASS } as any, { id: 'me' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
    it('requires scopeKey for SCHOOL', async () => {
      await expect(
        service.list({ scope: LeaderboardScope.SCHOOL } as any, { id: 'me' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
    it('flags current user inside top entries', async () => {
      repo.listScoped.mockResolvedValue([
        { id: 'e1', userId: 'me', rank: 5 },
        { id: 'e2', userId: 'other', rank: 6 },
      ]);
      const result = await service.list(
        { scope: LeaderboardScope.GLOBAL } as any,
        { id: 'me' },
      );
      expect(result.entries[0].isCurrentUser).toBe(true);
      expect(result.entries[1].isCurrentUser).toBe(false);
      expect(result.currentUser?.userId).toBe('me');
    });
    it('looks up current user when outside top entries', async () => {
      repo.listScoped.mockResolvedValue([{ id: 'e1', userId: 'other', rank: 1 }]);
      repo.findUserEntry.mockResolvedValue({ id: 'me-entry', userId: 'me', rank: 99 });
      const result = await service.list(
        { scope: LeaderboardScope.GLOBAL } as any,
        { id: 'me' },
      );
      expect(result.currentUser?.userId).toBe('me');
      expect(result.currentUser?.isCurrentUser).toBe(true);
    });
    it('returns null currentUser when user not on board', async () => {
      repo.listScoped.mockResolvedValue([{ id: 'e1', userId: 'other', rank: 1 }]);
      repo.findUserEntry.mockResolvedValue(null);
      const result = await service.list(
        { scope: LeaderboardScope.GLOBAL } as any,
        { id: 'me' },
      );
      expect(result.currentUser).toBeNull();
    });
    it('respects scopeKey + limit for CLASS', async () => {
      repo.listScoped.mockResolvedValue([]);
      repo.findUserEntry.mockResolvedValue(null);
      await service.list(
        { scope: LeaderboardScope.CLASS, scopeKey: 'cls1', limit: 5 } as any,
        { id: 'me' },
      );
      expect(repo.listScoped).toHaveBeenCalledWith(LeaderboardScope.CLASS, 'cls1', 5);
    });
  });

  describe('recompute', () => {
    it('requires scopeKey for CLASS', async () => {
      await expect(
        service.recompute(LeaderboardScope.CLASS, null),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
    it('writes ranked entries from totalScore + completion aggregate', async () => {
      repo.listUsersForScope.mockResolvedValue([
        { id: 'a', totalScore: 100 },
        { id: 'b', totalScore: 200 },
      ]);
      repo.getAggregatesForUsers.mockResolvedValue(
        new Map([['b', { coursesDone: 3 }]]),
      );
      repo.replaceScope.mockResolvedValue(2);

      const result = await service.recompute(LeaderboardScope.GLOBAL, null);
      expect(result.count).toBe(2);
      const written = repo.replaceScope.mock.calls[0][2] as any[];
      expect(written[0]).toMatchObject({ userId: 'b', rank: 1, points: 200, coursesDone: 3 });
      expect(written[1]).toMatchObject({ userId: 'a', rank: 2, points: 100, coursesDone: 0 });
    });
  });
});
