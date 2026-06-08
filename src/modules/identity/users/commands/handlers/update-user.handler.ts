import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mapRoleIds, mapUserRoles } from '../../common/user-mappers';
import { User } from '../../entities/user.entity';
import { logUserHandlerError } from '../../common/log-user-handler-error';
import { UpdateUserCommand } from '../impl/update-user.command';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand, User> {
  private readonly logger = new Logger(UpdateUserHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    try {
      const user = await this.repository.findOne({
        where: { id: command.id },
        relations: ['roles']
      });
      if (!user) {
        throw new NotFoundException('Utilisateur introuvable');
      }

      const { roles, ...dto } = command.dto;
      const updatedUser = this.repository.merge(user, {
        ...dto,
        roles: roles ? mapRoleIds(roles) : undefined
      });
      return mapUserRoles(await this.repository.save(updatedUser));
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      logUserHandlerError(this.logger, 'Update user', error, `id="${command.id}"`);
      throw new BadRequestException('Mise à jour impossible');
    }
  }
}
