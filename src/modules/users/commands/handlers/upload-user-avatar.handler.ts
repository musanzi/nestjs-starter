import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { promises } from 'fs';
import { Repository } from 'typeorm';
import { mapUserRoles } from '../../common/user-mappers';
import { User } from '../../entities/user.entity';
import { logHandlerError } from '@/shared/helpers';
import { UploadUserAvatarCommand } from '../impl/upload-user-avatar.command';

@CommandHandler(UploadUserAvatarCommand)
export class UploadUserAvatarHandler implements ICommandHandler<UploadUserAvatarCommand, User> {
  private readonly logger = new Logger(UploadUserAvatarHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ) {}

  async execute(command: UploadUserAvatarCommand): Promise<User> {
    try {
      if (command.currentUser.avatar) {
        await promises.unlink(`./uploads/profiles/${command.currentUser.avatar}`).catch(() => undefined);
      }

      const user = await this.repository.findOne({
        where: { id: command.currentUser.id },
        relations: ['roles']
      });
      if (!user) {
        throw new NotFoundException('Utilisateur introuvable');
      }

      const updatedUser = this.repository.merge(user, { avatar: command.file.filename });
      return mapUserRoles(await this.repository.save(updatedUser));
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      logHandlerError(this.logger, 'Upload user avatar', error, `id="${command.currentUser.id}"`);
      throw new BadRequestException("Ajout d'image impossible");
    }
  }
}
