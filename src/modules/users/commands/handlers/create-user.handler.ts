import { BadRequestException, Logger } from '@nestjs/common';
import { randomInt } from 'crypto';
import { CommandBus, CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SendGeneratedPasswordEmailCommand } from '@/modules/auth/commands/impl/send-generated-password-email.command';
import { mapRoleIds } from '../../common/user-mappers';
import { User } from '../../entities/user.entity';
import { UserResponse } from '../../interfaces';
import { FindUserByIdQuery } from '../../queries';
import { logHandlerError } from '@/shared/helpers';
import { CreateUserCommand } from '../impl/create-user.command';
import { FindRoleByNameQuery } from '@/modules/roles/queries';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, UserResponse> {
  private readonly logger = new Logger(CreateUserHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  async execute(command: CreateUserCommand): Promise<UserResponse> {
    const { roles, ...dto } = command.dto;
    const hasPassword = Boolean(dto.password);
    const generatedPassword = hasPassword ? undefined : this.generatePassword();
    const password = hasPassword ? dto.password : generatedPassword;

    try {
      const defaultRole = await this.queryBus.execute(new FindRoleByNameQuery('user'));
      const user = this.repository.create({
        ...dto,
        password,
        roles: roles ? mapRoleIds(roles) : [defaultRole]
      });
      const createdUser = await this.repository.save(user);

      if (generatedPassword) {
        await this.commandBus.execute(new SendGeneratedPasswordEmailCommand(createdUser, generatedPassword));
      }

      return await this.queryBus.execute(new FindUserByIdQuery(createdUser.id));
    } catch (error) {
      logHandlerError(this.logger, 'Create user', error, `email="${dto.email}"`);
      throw new BadRequestException("Création de l'utilisateur impossible");
    }
  }

  private generatePassword(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }
}
