import { Controller, Get } from '@nestjs/common';
import { AbstractController } from '@/shared/abstracts';
import { HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';
import { IStatItem } from '../interfaces';
import { FindStats } from '../queries';

@Controller('stats')
export class StatsController extends AbstractController {
  @Get()
  @HasRoles([Roles.ADMIN])
  findAll(): Promise<IStatItem[]> {
    return this.queryHandler.execute(new FindStats());
  }
}
