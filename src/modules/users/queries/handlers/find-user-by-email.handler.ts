import { Logger, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mapUserRoles } from '../../common/user-mappers';
import { User } from '../../entities/user.entity';
import { IUserResponse } from '../../interfaces';
import { FindUserByEmail } from '../impl';

@QueryHandler(FindUserByEmail)
export class FindUserByEmailHandler implements IQueryHandler<FindUserByEmail, IUserResponse> {
  private readonly logger = new Logger(FindUserByEmailHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ) {}

  async execute(query: FindUserByEmail): Promise<IUserResponse> {
    try {
      const user = await this.repository.findOneOrFail({
        where: { email: query.email },
        relations: ['roles']
      });
      return mapUserRoles(user);
    } catch (error) {
      this.logger.error(
        `Find user by email failed email="${query.email}": ${error instanceof Error ? error.message : String(error)}`
      );
      throw new NotFoundException('Utilisateur introuvable');
    }
  }
}
