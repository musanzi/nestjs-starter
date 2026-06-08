import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { promises } from 'fs';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserResponse } from '../../interfaces';
import { FindUserByIdQuery } from '../../queries';
import { logHandlerError } from '@/shared/helpers';
import { UploadUserAvatarCommand } from '../impl/upload-user-avatar.command';

@CommandHandler(UploadUserAvatarCommand)
export class UploadUserAvatarHandler implements ICommandHandler<UploadUserAvatarCommand, UserResponse> {
  private readonly logger = new Logger(UploadUserAvatarHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly queryBus: QueryBus
  ) {}

  async execute(command: UploadUserAvatarCommand): Promise<UserResponse> {
    try {
      const user = await this.queryBus.execute(new FindUserByIdQuery(command.currentUser.id));

      if (user.avatar) {
        await promises.unlink(`./uploads/profiles/${user.avatar}`).catch(() => undefined);
      }

      await this.repository.save({ id: command.currentUser.id, avatar: command.file.filename });
      return await this.queryBus.execute(new FindUserByIdQuery(command.currentUser.id));
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      logHandlerError(this.logger, 'Upload user avatar', error, `id="${command.currentUser.id}"`);
      throw new BadRequestException("Ajout d'image impossible");
    }
  }
}
