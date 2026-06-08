import { BadRequestException, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../entities/role.entity';
import { logHandlerError } from '@/shared/helpers';
import { UpdateRoleCommand } from '../impl/update-role.command';

@CommandHandler(UpdateRoleCommand)
export class UpdateRoleHandler implements ICommandHandler<UpdateRoleCommand, Role> {
  private readonly logger = new Logger(UpdateRoleHandler.name);

  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>
  ) {}

  async execute(command: UpdateRoleCommand): Promise<Role> {
    try {
      const role = await this.repository.findOne({ where: { id: command.id } });
      if (!role) {
        throw new NotFoundException('Rôle introuvable');
      }

      if (command.dto.name) {
        const existingRole = await this.repository.findOne({ where: { name: command.dto.name } });
        if (existingRole && existingRole.id !== command.id) {
          throw new ConflictException('Ce rôle existe déjà');
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
