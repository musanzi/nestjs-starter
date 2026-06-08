import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { logHandlerError } from '@/shared/helpers';
import { DeleteUserCommand } from '../impl/delete-user.command';

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand, void> {
  private readonly logger = new Logger(DeleteUserHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    try {
      const user = await this.repository.findOne({ where: { id: command.id } });
      if (!user) {
        throw new NotFoundException('Utilisateur introuvable');
      }

      await this.repository.softDelete(command.id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      logHandlerError(this.logger, 'Delete user', error, `id="${command.id}"`);
      throw new BadRequestException('Suppression impossible');
    }
  }
}
