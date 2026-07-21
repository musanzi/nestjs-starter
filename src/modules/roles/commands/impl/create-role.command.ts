import { Command } from '@nestjs/cqrs';
import { Role } from '../../entities/role.entity';

export class CreateRole extends Command<Role> {
  constructor(public readonly data: { name: string }) {
    super();
  }
}
