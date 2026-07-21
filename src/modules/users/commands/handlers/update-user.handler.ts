import { BadRequestException, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mapRoleIds } from '../../common/user-mappers';
import { User } from '../../entities/user.entity';
import { IUserResponse } from '../../interfaces';
import { FindUserById } from '../../queries';
import { UpdateUser } from '../impl';

@CommandHandler(UpdateUser)
export class UpdateUserHandler implements ICommandHandler<UpdateUser, IUserResponse> {
  private readonly logger = new Logger(UpdateUserHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly queryBus: QueryBus
  ) {}

  async execute(command: UpdateUser): Promise<IUserResponse> {
    const { roles, ...data } = { ...command.dto };

    try {
      const user = await this.repository.findOne({
        where: { id: command.id }
      });

      if (!user) {
        throw new NotFoundException('Aucun utilisateur trouvé');
      }

      if (data.email && data.email !== user.email) {
        const existingUser = await this.repository.findOne({
          where: { email: data.email }
        });

        if (existingUser) {
          throw new ConflictException('Un utilisateur avec cette adresse email existe déjà');
        }
      }

      const updatedUser = await this.repository.save(
        this.repository.merge(user, {
          ...data,
          roles: roles ? mapRoleIds(roles) : undefined
        })
      );
      return this.queryBus.execute(new FindUserById(updatedUser.id));
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;

      this.logger.error(
        `Update user failed id="${command.id}": ${error instanceof Error ? error.message : String(error)}`
      );
      throw new BadRequestException('Mise à jour impossible');
    }
  }
}
