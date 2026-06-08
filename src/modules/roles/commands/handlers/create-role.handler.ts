import { BadRequestException, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../entities/role.entity';
import { FindRoleByNameQuery } from '../../queries';
import { CreateRoleCommand } from '../impl/create-role.command';
import { logHandlerError } from '@/shared/helpers';

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand, Role> {
  private readonly logger = new Logger(CreateRoleHandler.name);

  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>,
    private readonly queryBus: QueryBus
  ) {}

  async execute(command: CreateRoleCommand): Promise<Role> {
    const { name } = command.dto;

    try {
      try {
        await this.queryBus.execute(new FindRoleByNameQuery(name));
        throw new ConflictException('Ce rôle existe déjà');
      } catch (error) {
        if (!(error instanceof NotFoundException)) throw error;
      }

      const role = this.repository.create(command.dto);
      return await this.repository.save(role);
    } catch (error) {
      if (error instanceof ConflictException) throw error;

      logHandlerError(this.logger, 'Create role', error, `name="${name}"`);
      throw new BadRequestException('Création du rôle impossible');
    }
  }
}
