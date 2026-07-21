import { BadRequestException, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../entities/role.entity';
import { FindRoleById } from '../../queries';
import { UpdateRole } from '../impl';

@CommandHandler(UpdateRole)
export class UpdateRoleHandler implements ICommandHandler<UpdateRole, Role> {
  private readonly logger = new Logger(UpdateRoleHandler.name);

  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>,
    private readonly queryBus: QueryBus
  ) {}

  async execute(command: UpdateRole): Promise<Role> {
    const { dto, id } = command;

    try {
      const role = await this.queryBus.execute(new FindRoleById(id));

      if (dto.name && dto.name !== role.name) {
        const existingRole = await this.repository.findOne({
          where: { name: dto.name }
        });

        if (existingRole) {
          throw new ConflictException('Ce rôle existe déjà');
        }
      }

      return await this.repository.save(this.repository.merge(role, dto));
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) throw error;

      this.logger.error(`Update role failed id="${id}": ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException('Mise à jour du rôle impossible');
    }
  }
}
