import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PaginatedResult, buildPaginatedResult } from '../catalog/dto/pagination.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfilePayload, ProfileRepository } from './profile.repository';

interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class ProfileService {
  constructor(private readonly repo: ProfileRepository) {}

  async getMe(actor: ActorContext): Promise<ProfilePayload> {
    const me = await this.repo.findById(actor.id);
    if (!me) throw new NotFoundException('Profile not found');
    return me;
  }

  async updateMe(actor: ActorContext, dto: UpdateProfileDto): Promise<ProfilePayload> {
    const data: Prisma.UserUpdateInput = {
      ...(dto.fullName !== undefined && { fullName: dto.fullName }),
      ...(dto.initials !== undefined && { initials: dto.initials }),
      ...(dto.bio !== undefined && { bio: dto.bio }),
      ...(dto.mobile !== undefined && { mobile: dto.mobile }),
      ...(dto.grade !== undefined && { grade: dto.grade }),
      ...(dto.schoolName !== undefined && { schoolName: dto.schoolName }),
      ...(dto.rollNo !== undefined && { rollNo: dto.rollNo }),
      ...(dto.instructorTitle !== undefined && { instructorTitle: dto.instructorTitle }),
      ...(dto.age !== undefined && { age: dto.age }),
      ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      ...(dto.bannerUrl !== undefined && { bannerUrl: dto.bannerUrl }),
    };
    await this.repo.update(actor.id, data);
    return this.getMe(actor);
  }

  async findById(id: string, actor: ActorContext): Promise<ProfilePayload> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundException(`User ${id} not found`);
    if (actor.role === UserRole.STUDENT && actor.id !== id) {
      throw new ForbiddenException('Students can only view their own profile');
    }
    return found;
  }

  async listStaff(page: number, pageSize: number): Promise<PaginatedResult<ProfilePayload>> {
    const skip = (Math.max(1, page) - 1) * pageSize;
    const { items, total } = await this.repo.listStaff(skip, pageSize);
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async listStudents(page: number, pageSize: number): Promise<PaginatedResult<ProfilePayload>> {
    const skip = (Math.max(1, page) - 1) * pageSize;
    const { items, total } = await this.repo.listStudents(skip, pageSize);
    return buildPaginatedResult(items, total, page, pageSize);
  }
}
