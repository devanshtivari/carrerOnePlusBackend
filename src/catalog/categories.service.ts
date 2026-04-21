import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category, Prisma } from '@prisma/client';

import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly repo: CategoriesRepository) {}

  async list(): Promise<Category[]> {
    return this.repo.findAll();
  }

  async findById(id: string): Promise<Category> {
    const category = await this.repo.findById(id);
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.repo.findBySlug(slug);
    if (!category) {
      throw new NotFoundException(`Category ${slug} not found`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.repo.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(`Category with slug "${dto.slug}" already exists`);
    }
    return this.repo.create({
      slug: dto.slug,
      label: dto.label,
      iconName: dto.iconName,
      position: dto.position ?? 0,
    });
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    await this.findById(id);
    if (dto.slug) {
      const conflict = await this.repo.findBySlug(dto.slug);
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`Category with slug "${dto.slug}" already exists`);
      }
    }
    const data: Prisma.CategoryUpdateInput = {
      ...(dto.slug !== undefined && { slug: dto.slug }),
      ...(dto.label !== undefined && { label: dto.label }),
      ...(dto.iconName !== undefined && { iconName: dto.iconName }),
      ...(dto.position !== undefined && { position: dto.position }),
    };
    return this.repo.update(id, data);
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    await this.findById(id);
    await this.repo.softDelete(id);
    return { id, deleted: true };
  }
}
