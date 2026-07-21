import { Command } from '@nestjs/cqrs';
import { Role } from '../../entities/role.entity';

export class UpdateRole extends Command<Role> {
  constructor(
    public readonly id: string,
    public readonly data: { name?: string }
  ) {
    super();
  }
}
