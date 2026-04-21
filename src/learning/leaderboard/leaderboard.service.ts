import { BadRequestException, Injectable } from '@nestjs/common';
import { LeaderboardScope } from '@prisma/client';

import { ListLeaderboardQueryDto } from '../dto/list-leaderboard.dto';
import {
  LeaderboardEntryDetail,
  LeaderboardRepository,
} from './leaderboard.repository';

interface ActorContext {
  id: string;
}

export interface ScopedLeaderboard {
  scope: LeaderboardScope;
  scopeKey: string | null;
  entries: (LeaderboardEntryDetail & { isCurrentUser: boolean })[];
  currentUser: (LeaderboardEntryDetail & { isCurrentUser: true }) | null;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly repo: LeaderboardRepository) {}

  async list(
    query: ListLeaderboardQueryDto,
    actor: ActorContext,
  ): Promise<ScopedLeaderboard> {
    this.assertScopeKey(query);
    const limit = query.limit ?? 10;
    const scopeKey = query.scopeKey ?? null;

    const entries = await this.repo.listScoped(query.scope, scopeKey, limit);
    const decorated = entries.map((e) => ({ ...e, isCurrentUser: e.userId === actor.id }));

    let currentUserEntry = decorated.find((e) => e.isCurrentUser) ?? null;
    if (!currentUserEntry) {
      const meEntry = await this.repo.findUserEntry(query.scope, scopeKey, actor.id);
      if (meEntry) {
        currentUserEntry = { ...meEntry, isCurrentUser: true };
      }
    }

    return {
      scope: query.scope,
      scopeKey,
      entries: decorated,
      currentUser: (currentUserEntry as ScopedLeaderboard['currentUser']) ?? null,
    };
  }

  async recompute(
    scope: LeaderboardScope,
    scopeKey: string | null,
  ): Promise<{ scope: LeaderboardScope; scopeKey: string | null; count: number }> {
    if ((scope === LeaderboardScope.CLASS || scope === LeaderboardScope.SCHOOL) && !scopeKey) {
      throw new BadRequestException('scopeKey is required for CLASS / SCHOOL leaderboards');
    }

    const users = await this.repo.listUsersForScope(scope, scopeKey);
    const sorted = [...users].sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));
    const aggregates = await this.repo.getAggregatesForUsers(sorted.map((u) => u.id));

    const rows = sorted.map((u, index) => ({
      scope,
      scopeKey: scopeKey ?? null,
      userId: u.id,
      rank: index + 1,
      points: u.totalScore ?? 0,
      coursesDone: aggregates.get(u.id)?.coursesDone ?? 0,
      streakDays: 0,
      computedAt: new Date(),
    }));

    const count = await this.repo.replaceScope(scope, scopeKey, rows);
    return { scope, scopeKey, count };
  }

  private assertScopeKey(query: ListLeaderboardQueryDto): void {
    if (
      (query.scope === LeaderboardScope.CLASS || query.scope === LeaderboardScope.SCHOOL) &&
      !query.scopeKey
    ) {
      throw new BadRequestException(
        'scopeKey is required for CLASS / SCHOOL leaderboards',
      );
    }
  }
}
