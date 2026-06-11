import { Logger, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mapUserRoles } from '../../common/user-mappers';
import { User } from '../../entities/user.entity';
import { IUserResponse } from '../../interfaces';
import { FindUserByIdQuery } from '../impl';

@QueryHandler(FindUserByIdQuery)
export class FindUserByIdHandler implements IQueryHandler<FindUserByIdQuery, IUserResponse> {
  private readonly logger = new Logger(FindUserByIdHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ) {}

  async execute(query: FindUserByIdQuery): Promise<IUserResponse> {
    try {
      const user = await this.repository.findOneOrFail({
        where: { id: query.id },
        relations: ['roles']
      });
      return mapUserRoles(user);
    } catch (error) {
      this.logger.error(
        `Find user by id failed id="${query.id}": ${error instanceof Error ? error.message : String(error)}`
      );
      throw new NotFoundException('Utilisateur introuvable');
    }
  }
}
