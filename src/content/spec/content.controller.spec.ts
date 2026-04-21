import { Test, TestingModule } from '@nestjs/testing';

import { siteContent } from '../content.config';
import { ContentController } from '../content.controller';

describe('ContentController', () => {
  let controller: ContentController;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ContentController],
    }).compile();
    controller = moduleRef.get(ContentController);
  });

  it('returns full site content', () => {
    expect(controller.getAll()).toBe(siteContent);
  });

  it('returns navigation block', () => {
    const nav = controller.getNavigation();
    expect(nav.brand).toBe(siteContent.brand);
    expect(nav.navLinks).toBe(siteContent.navLinks);
    expect(nav.studentNavItems).toBe(siteContent.studentNavItems);
    expect(nav.teacherNavItems).toBe(siteContent.teacherNavItems);
  });

  it('returns footer block', () => {
    expect(controller.getFooter()).toBe(siteContent.footer);
  });

  it('returns landing block', () => {
    expect(controller.getLanding()).toBe(siteContent.landing);
  });
});
