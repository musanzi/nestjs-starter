import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../entities/role.entity';
import { logHandlerError } from '@/shared/helpers';
import { DeleteRoleCommand } from '../impl/delete-role.command';

@CommandHandler(DeleteRoleCommand)
export class DeleteRoleHandler implements ICommandHandler<DeleteRoleCommand, void> {
  private readonly logger = new Logger(DeleteRoleHandler.name);

  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>
  ) {}

  async execute(command: DeleteRoleCommand): Promise<void> {
    try {
      const role = await this.repository.findOne({ where: { id: command.id } });
      if (!role) {
        throw new NotFoundException('Rôle introuvable');
      }

      await this.repository.delete(command.id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      logHandlerError(this.logger, 'Delete role', error, `id="${command.id}"`);
      throw new BadRequestException('Suppression du rôle impossible');
    }
  }
}
