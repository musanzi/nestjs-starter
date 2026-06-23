import { Module } from '@nestjs/common';
import { StatsController } from './controllers/stats.controller';
import { QueryHandlers } from './queries/handlers';

@Module({
  controllers: [StatsController],
  providers: [...QueryHandlers]
})
export class StatsModule {}
