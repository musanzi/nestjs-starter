import { BadRequestException, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '@/modules/roles/entities/role.entity';
import { logHandlerError } from '@/shared/helpers';
import { mapUserRoles } from '../../common/user-mappers';
import { User } from '../../entities/user.entity';
import { FindOrCreateUserCommand } from '../impl/find-or-create-user.command';

@CommandHandler(FindOrCreateUserCommand)
export class FindOrCreateUserHandler implements ICommandHandler<FindOrCreateUserCommand, User> {
  private readonly logger = new Logger(FindOrCreateUserHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>
  ) {}

  async execute(command: FindOrCreateUserCommand): Promise<User> {
    const { dto } = command;

    try {
      const existingUser = await this.userRepository.findOne({
        where: { email: dto.email },
        relations: ['roles']
      });

      if (existingUser) {
        const updatedUser = this.userRepository.merge(existingUser, {
          name: dto.name ?? existingUser.name,
          avatar: dto.avatar ?? existingUser.avatar
        });
        return mapUserRoles(await this.userRepository.save(updatedUser));
      }

      const defaultRole = await this.roleRepository.findOne({ where: { name: 'user' } });
      const user = this.userRepository.create({
        ...dto,
        roles: defaultRole ? [{ id: defaultRole.id }] : undefined
      });
      const savedUser = await this.userRepository.save(user);
      const createdUser = await this.userRepository.findOne({
        where: { id: savedUser.id },
        relations: ['roles']
      });

      return mapUserRoles(createdUser ?? savedUser);
    } catch (error) {
      logHandlerError(this.logger, 'Find or create user', error, `email="${dto.email}"`);
      throw new BadRequestException('Requête invalide');
    }
  }
}
