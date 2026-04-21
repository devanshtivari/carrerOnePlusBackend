import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User, Prisma } from '@prisma/client';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly redisService: RedisService,
  ) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.usersRepository.create(data);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async findByProviderId(providerId: string): Promise<User | null> {
    return this.usersRepository.findByProviderId(providerId);
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.usersRepository.update(id, data);
  }

  async getAiContext(userId: string): Promise<any> {
    const cacheKey = `ai_context:user_${userId}`;
    const cached = await this.redisService.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // In a real scenario, you can fetch progress/stats from other tables
    const context = {
      email: user.email,
      recentActivity: 'Learning foundational concepts', // Placeholder: Query actual DB relations here
      struggles: 'Syntax errors', // Placeholder: Query actual DB relations here
    };

    // Cache the context for 15 minutes (900 seconds)
    await this.redisService.set(cacheKey, JSON.stringify(context), 900);
    return context;
  }
}

