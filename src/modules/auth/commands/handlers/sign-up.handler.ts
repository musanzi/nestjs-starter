import { BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '@/modules/roles/entities/role.entity';
import { User } from '@/modules/users/entities/user.entity';
import { logHandlerError } from '@/shared/helpers';
import { mapUserRoles } from '@/modules/users/common/user-mappers';
import { WelcomeUserEvent } from '../../events';
import { SignUpCommand } from '../impl/sign-up.command';

@CommandHandler(SignUpCommand)
export class SignUpHandler implements ICommandHandler<SignUpCommand, User> {
  private readonly logger = new Logger(SignUpHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: SignUpCommand): Promise<User> {
    const { dto } = command;

    try {
      const existingUser = await this.userRepository.findOne({ where: { email: dto.email } });
      if (existingUser) {
        throw new ConflictException('Cet utilisateur existe déjà');
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
      const result = mapUserRoles(createdUser ?? savedUser);
      this.eventBus.publish(new WelcomeUserEvent(result));
      return result;
    } catch (error) {
      if (error instanceof ConflictException) throw error;

      logHandlerError(this.logger, 'Sign up', error, `email="${dto.email}"`);
      throw new BadRequestException(error['message'] ?? 'Inscription impossible');
    }
  }
}
