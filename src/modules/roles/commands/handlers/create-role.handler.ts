import { BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../entities/role.entity';
import { CreateRoleCommand } from '../impl';

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

      this.logger.error(`Create role failed name="${name}": ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException('Création du rôle impossible');
    }
  }
}
