import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardScope, User, UserRole } from '@prisma/client';

import { LeaderboardController } from '../leaderboard/leaderboard.controller';
import { LeaderboardService } from '../leaderboard/leaderboard.service';

describe('LeaderboardController', () => {
  let controller: LeaderboardController;
  const service = {
    list: jest.fn(),
    recompute: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [LeaderboardController],
      providers: [{ provide: LeaderboardService, useValue: service }],
    }).compile();
    controller = moduleRef.get(LeaderboardController);
  });

  afterEach(() => jest.clearAllMocks());

  it('list delegates with actor id', async () => {
    service.list.mockResolvedValue({ entries: [], currentUser: null });
    const user = { id: 'me', role: UserRole.STUDENT } as User;
    await controller.list({ scope: LeaderboardScope.GLOBAL } as any, user);
    expect(service.list).toHaveBeenCalledWith(
      { scope: LeaderboardScope.GLOBAL },
      { id: 'me' },
    );
  });
  it('recompute delegates', async () => {
    service.recompute.mockResolvedValue({ scope: LeaderboardScope.SCHOOL, scopeKey: 's', count: 5 });
    await controller.recompute({ scope: LeaderboardScope.SCHOOL, scopeKey: 's' } as any);
    expect(service.recompute).toHaveBeenCalledWith(LeaderboardScope.SCHOOL, 's');
  });
  it('recompute defaults scopeKey to null', async () => {
    service.recompute.mockResolvedValue({ scope: LeaderboardScope.GLOBAL, scopeKey: null, count: 0 });
    await controller.recompute({ scope: LeaderboardScope.GLOBAL } as any);
    expect(service.recompute).toHaveBeenCalledWith(LeaderboardScope.GLOBAL, null);
  });
});
