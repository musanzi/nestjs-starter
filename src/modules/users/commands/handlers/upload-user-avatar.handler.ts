import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { promises } from 'fs';
import { UserResponse } from '../../interfaces';
import { logHandlerError } from '@/shared/helpers';
import { UploadUserAvatarCommand } from '../impl/upload-user-avatar.command';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindUserByIdQuery } from '../../queries';

@CommandHandler(UploadUserAvatarCommand)
export class UploadUserAvatarHandler implements ICommandHandler<UploadUserAvatarCommand, UserResponse> {
  private readonly logger = new Logger(UploadUserAvatarHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly queryBus: QueryBus
  ) {}

  async execute(command: UploadUserAvatarCommand): Promise<UserResponse> {
    const { currentUser, file } = command;

    try {
      if (currentUser.avatar) {
        await promises.unlink(`./uploads/profiles/${currentUser.avatar}`);
      }

      await this.repository.update(currentUser.id, {
        avatar: file.filename
      });

      return await this.queryBus.execute(new FindUserByIdQuery(currentUser.id));
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      logHandlerError(this.logger, 'Upload user avatar', error, `id="${currentUser.id}"`);
      throw new BadRequestException("Ajout d'image impossible");
    }
  }
}
