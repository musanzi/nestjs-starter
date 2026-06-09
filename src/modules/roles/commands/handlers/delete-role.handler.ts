import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../entities/role.entity';
import { FindRoleQuery } from '../../queries';
import { logHandlerError } from '@/shared/helpers';
import { DeleteRoleCommand } from '../impl/delete-role.command';

@CommandHandler(DeleteRoleCommand)
export class DeleteRoleHandler implements ICommandHandler<DeleteRoleCommand, void> {
  private readonly logger = new Logger(DeleteRoleHandler.name);

  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>,
    private readonly queryBus: QueryBus
  ) {}

  async execute(command: DeleteRoleCommand): Promise<void> {
    try {
      await this.queryBus.execute(
        new FindRoleQuery({
          where: { id: command.id }
        })
      );

      await this.repository.delete(command.id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      logHandlerError(this.logger, 'Delete role', error, `id="${command.id}"`);
      throw new BadRequestException('Suppression du rôle impossible');
    }
  }
}
