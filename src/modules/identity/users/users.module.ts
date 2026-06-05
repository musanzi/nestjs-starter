import { Module } from '@nestjs/common';
import { UserMediaController } from './controllers/user-media.controller';
import { UsersController } from './controllers/users.controller';
import { UsersExportController } from './controllers/users-export.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './services/users.service';
import { RolesModule } from '../../identity/roles/roles.module';
import { UserSubscriber } from './subscribers/user.subscriber';
import { UsersExportService } from './services/users-export.service';
import { UserMediaService } from './services/user-media.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), RolesModule],
  controllers: [UsersExportController, UserMediaController, UsersController],
  providers: [UsersService, UsersExportService, UserMediaService, UserSubscriber],
  exports: [UsersService]
})
export class UsersModule {}
