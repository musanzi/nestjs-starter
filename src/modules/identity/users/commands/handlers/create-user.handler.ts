import { BadRequestException, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mapRoleIds, mapUserRoles } from '../../common/user-mappers';
import { User } from '../../entities/user.entity';
import { logHandlerError } from '@/shared/helpers';
import { CreateUserCommand } from '../impl/create-user.command';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, User> {
  private readonly logger = new Logger(CreateUserHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    try {
      const user = this.repository.create({
        ...command.dto,
        password: 'user1234',
        roles: mapRoleIds(command.dto.roles)
      });
      const createdUser = await this.repository.save(user);
      const savedUser = await this.repository.findOne({
        where: { id: createdUser.id },
        relations: ['roles']
      });
      return mapUserRoles(savedUser ?? createdUser);
    } catch (error) {
      logHandlerError(this.logger, 'Create user', error, `email="${command.dto.email}"`);
      throw new BadRequestException("Création de l'utilisateur impossible");
    }
  }
}
