import { BadRequestException, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../entities/role.entity';
import { FindRoleByIdQuery, FindRoleByNameQuery } from '../../queries';
import { logHandlerError } from '@/shared/helpers';
import { UpdateRoleCommand } from '../impl/update-role.command';

@CommandHandler(UpdateRoleCommand)
export class UpdateRoleHandler implements ICommandHandler<UpdateRoleCommand, Role> {
  private readonly logger = new Logger(UpdateRoleHandler.name);

  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>,
    private readonly queryBus: QueryBus
  ) {}

  async execute(command: UpdateRoleCommand): Promise<Role> {
    try {
      const role = await this.queryBus.execute(new FindRoleByIdQuery(command.id));

      if (command.dto.name) {
        try {
          const existingRole = await this.queryBus.execute(new FindRoleByNameQuery(command.dto.name));
          if (existingRole.id !== command.id) {
            throw new ConflictException('Ce rôle existe déjà');
          }
        } catch (error) {
          if (!(error instanceof NotFoundException)) throw error;
        }
      }

      return await this.repository.save(this.repository.merge(role, command.dto));
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) throw error;

      logHandlerError(this.logger, 'Update role', error, `id="${command.id}"`);
      throw new BadRequestException('Mise à jour du rôle impossible');
    }
  }
}
