import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Roles } from '@/modules/auth/decorators';
import { RoleEnum } from '@/modules/auth/enums';
import { IStatItem } from '../interfaces';
import { FindStatsQuery } from '../queries';

@Controller('stats')
export class StatsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Roles([RoleEnum.ADMIN])
  findAll(): Promise<IStatItem[]> {
    return this.queryBus.execute(new FindStatsQuery());
  }
}
