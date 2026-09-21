import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '@/shared/abstracts';
import { HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';
import { IStatItem, StatItem } from '../interfaces';
import { FindStats } from '../queries';

@ApiTags('stats')
@ApiBearerAuth()
@Controller('stats')
export class StatsController extends AbstractController {
  @Get()
  @HasRoles([Roles.ADMIN])
  @ApiOperation({ summary: 'Get statistics (admin only)' })
  @ApiOkResponse({ type: [StatItem], description: 'List of statistics' })
  findAll(): Promise<IStatItem[]> {
    return this.queryHandler.execute(new FindStats());
  }
}
