import { BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../entities/role.entity';
import { CreateRoleCommand } from '../impl/create-role.command';
import { logHandlerError } from '@/shared/helpers';

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand, Role> {
  private readonly logger = new Logger(CreateRoleHandler.name);

  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>
  ) {}

  async execute(command: CreateRoleCommand): Promise<Role> {
    const { name } = command.dto;

    try {
      const role = await this.repository.findOne({
        where: { name }
      });

      if (role) {
        throw new ConflictException('Ce rôle existe déjà');
      }

      return await this.repository.save(this.repository.create(command.dto));
    } catch (error) {
      if (error instanceof ConflictException) throw error;

      logHandlerError(this.logger, 'Create role', error, `name="${name}"`);
      throw new BadRequestException('Création du rôle impossible');
    }
  }
}
