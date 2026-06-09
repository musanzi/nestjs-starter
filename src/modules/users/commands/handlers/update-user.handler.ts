import { BadRequestException, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mapRoleIds } from '../../common/user-mappers';
import { User } from '../../entities/user.entity';
import { UserResponse } from '../../interfaces';
import { FindUserQuery } from '../../queries';
import { logHandlerError } from '@/shared/helpers';
import { UpdateUserCommand } from '../impl/update-user.command';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand, UserResponse> {
  private readonly logger = new Logger(UpdateUserHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly queryBus: QueryBus
  ) {}

  async execute(command: UpdateUserCommand): Promise<UserResponse> {
    const { roles, ...dto } = command.dto;

    try {
      const user = await this.repository.findOne({
        where: { id: command.id }
      });

      if (!user) {
        throw new NotFoundException('Aucun utilisateur trouvé');
      }

      if (dto.email && dto.email !== user.email) {
        const existingUser = await this.repository.findOne({
          where: { email: dto.email }
        });

        if (existingUser) {
          throw new ConflictException('Un utilisateur avec cette adresse email existe déjà');
        }
      }

      const updatedUser = await this.repository.save(
        this.repository.merge(user, {
          ...dto,
          roles: roles ? mapRoleIds(roles) : undefined
        })
      );
      return this.queryBus.execute(
        new FindUserQuery({ id: updatedUser.id })
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;

      logHandlerError(this.logger, 'Update user', error, `id="${command.id}"`);
      throw new BadRequestException('Mise à jour impossible');
    }
  }
}
