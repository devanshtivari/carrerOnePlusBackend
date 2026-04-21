import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../common/decorators/public.decorator';
import { siteContent } from './content.config';

@ApiTags('Content')
@Controller('content')
@Public()
export class ContentController {
  @Get()
  @ApiOperation({ summary: 'Full site content payload' })
  getAll() {
    return siteContent;
  }

  @Get('navigation')
  @ApiOperation({ summary: 'Top-level navigation links + sidebar items' })
  getNavigation() {
    return {
      brand: siteContent.brand,
      navLinks: siteContent.navLinks,
      studentNavItems: siteContent.studentNavItems,
      teacherNavItems: siteContent.teacherNavItems,
    };
  }

  @Get('footer')
  @ApiOperation({ summary: 'Footer columns and legal copy' })
  getFooter() {
    return siteContent.footer;
  }

  @Get('landing')
  @ApiOperation({ summary: 'Landing page copy + assets' })
  getLanding() {
    return siteContent.landing;
  }
}
