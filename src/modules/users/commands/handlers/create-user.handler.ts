import { BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { randomInt } from 'crypto';
import { CommandHandler, EventBus, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mapRoleIds } from '../../common/user-mappers';
import { User } from '../../entities/user.entity';
import { IUserResponse } from '../../interfaces';
import { FindUserByIdQuery } from '../../queries';
import { CreateUserCommand } from '../impl';
import { WelcomeUserEvent } from '../../events';
import { FindRoleByNameQuery } from '@/modules/roles/queries';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, IUserResponse> {
  private readonly logger = new Logger(CreateUserHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly eventBus: EventBus,
    private readonly queryBus: QueryBus
  ) {}

  async execute(command: CreateUserCommand): Promise<IUserResponse> {
    const { roles, ...dto } = command.dto;
    const hasPassword = Boolean(dto.password);
    const generatedPassword = hasPassword ? undefined : this.generatePassword();
    const password = dto.password ?? generatedPassword;

    try {
      const existingUser = await this.repository.findOne({
        where: { email: dto.email }
      });

      if (existingUser) {
        throw new ConflictException('Cet utilisateur existe déjà');
      }

      const userRoles = roles ? mapRoleIds(roles) : [await this.queryBus.execute(new FindRoleByNameQuery('user'))];
      const user = this.repository.create({
        ...dto,
        password,
        roles: userRoles
      });

      const createdUser = await this.repository.save(user);

      this.eventBus.publish(new WelcomeUserEvent(createdUser, generatedPassword));

      return await this.queryBus.execute(new FindUserByIdQuery(createdUser.id));
    } catch (error) {
      if (error instanceof ConflictException) throw error;

      this.logger.error(
        `Create user failed email="${dto.email}": ${error instanceof Error ? error.message : String(error)}`
      );
      throw new BadRequestException("Création de l'utilisateur impossible");
    }
  }

  private generatePassword(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }
}
