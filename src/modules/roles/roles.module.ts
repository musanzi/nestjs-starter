import { Module } from '@nestjs/common';
import { RolesController } from './controllers/roles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { CqrsModule } from '@nestjs/cqrs';
import { CommandHandlers } from './commands/handlers';
import { QueryHandlers } from './queries/handlers';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([Role])],
  controllers: [RolesController],
  providers: [...CommandHandlers, ...QueryHandlers]
})
export class RolesModule {}
