import { BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { randomInt } from 'crypto';
import { CommandHandler, EventBus, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mapRoleIds } from '../../common/user-mappers';
import { User } from '../../entities/user.entity';
import { IUserResponse } from '../../interfaces';
import { FindUserById } from '../../queries';
import { CreateUser } from '../impl';
import { WelcomeUserEvent } from '../../events';
import { FindRoleByName } from '@/modules/roles/queries';

@CommandHandler(CreateUser)
export class CreateUserHandler implements ICommandHandler<CreateUser, IUserResponse> {
  private readonly logger = new Logger(CreateUserHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly eventBus: EventBus,
    private readonly queryBus: QueryBus
  ) {}

  async execute(command: CreateUser): Promise<IUserResponse> {
    const { roles, ...data } = { ...command.dto };
    const hasPassword = Boolean(data.password);
    const generatedPassword = hasPassword ? undefined : this.generatePassword();
    const password = data.password ?? generatedPassword;

    try {
      const existingUser = await this.repository.findOne({
        where: { email: data.email }
      });

      if (existingUser) {
        throw new ConflictException('Cet utilisateur existe déjà');
      }

      const userRoles = roles ? mapRoleIds(roles) : [await this.queryBus.execute(new FindRoleByName('user'))];
      const user = this.repository.create({
        ...data,
        password,
        roles: userRoles
      });

      const createdUser = await this.repository.save(user);

      this.eventBus.publish(new WelcomeUserEvent(createdUser, generatedPassword));

      return await this.queryBus.execute(new FindUserById(createdUser.id));
    } catch (error) {
      if (error instanceof ConflictException) throw error;

      this.logger.error(
        `Create user failed email="${data.email}": ${error instanceof Error ? error.message : String(error)}`
      );
      throw new BadRequestException("Création de l'utilisateur impossible");
    }
  }

  private generatePassword(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }
}
