import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export interface CurriculumTree {
  id: string;
  slug: string;
  title: string;
  units: Array<{
    id: string;
    moduleNumber: number;
    title: string;
    description: string | null;
    durationLabel: string | null;
    status: string;
    isLocked: boolean;
    chapters: Array<{
      id: string;
      title: string;
      description: string | null;
      position: number;
      durationLabel: string | null;
      totalLessons: number | null;
      lessons: Array<{
        id: string;
        title: string;
        type: string;
        durationLabel: string | null;
        position: number;
      }>;
    }>;
    resources: Array<{
      id: string;
      name: string;
      kind: string | null;
      url: string | null;
      sizeLabel: string | null;
    }>;
  }>;
}

@Injectable()
export class CurriculumService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurriculumByCourseId(courseId: string): Promise<CurriculumTree> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: this.curriculumSelect(),
    });
    if (!course) throw new NotFoundException(`Course ${courseId} not found`);
    return this.shape(course);
  }

  async getCurriculumBySlug(slug: string): Promise<CurriculumTree> {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      select: this.curriculumSelect(),
    });
    if (!course) throw new NotFoundException(`Course ${slug} not found`);
    return this.shape(course);
  }

  private curriculumSelect() {
    return {
      id: true,
      slug: true,
      title: true,
      units: {
        orderBy: [{ position: 'asc' as const }, { moduleNumber: 'asc' as const }],
        select: {
          id: true,
          moduleNumber: true,
          title: true,
          description: true,
          durationLabel: true,
          status: true,
          isLocked: true,
          chapters: {
            orderBy: { position: 'asc' as const },
            select: {
              id: true,
              title: true,
              description: true,
              position: true,
              durationLabel: true,
              totalLessons: true,
              lessons: {
                orderBy: { position: 'asc' as const },
                select: {
                  id: true,
                  title: true,
                  type: true,
                  durationLabel: true,
                  position: true,
                },
              },
            },
          },
          resources: {
            orderBy: [{ position: 'asc' as const }, { name: 'asc' as const }],
            select: {
              id: true,
              name: true,
              kind: true,
              url: true,
              sizeLabel: true,
            },
          },
        },
      },
    };
  }

  private shape(course: any): CurriculumTree {
    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      units: course.units.map((u: any) => ({
        id: u.id,
        moduleNumber: u.moduleNumber,
        title: u.title,
        description: u.description,
        durationLabel: u.durationLabel,
        status: u.status,
        isLocked: u.isLocked,
        chapters: u.chapters.map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          position: c.position,
          durationLabel: c.durationLabel,
          totalLessons: c.totalLessons,
          lessons: c.lessons.map((l: any) => ({
            id: l.id,
            title: l.title,
            type: l.type,
            durationLabel: l.durationLabel,
            position: l.position,
          })),
        })),
        resources: u.resources.map((r: any) => ({
          id: r.id,
          name: r.name,
          kind: r.kind,
          url: r.url,
          sizeLabel: r.sizeLabel,
        })),
      })),
    };
  }
}
