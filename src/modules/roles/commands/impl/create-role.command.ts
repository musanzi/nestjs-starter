import { Command } from '@nestjs/cqrs';
import { CreateRoleDto } from '../../dto/create-role.dto';
import { Role } from '../../entities/role.entity';

export class CreateRoleCommand extends Command<Role> {
  constructor(public readonly dto: CreateRoleDto) {
    super();
  }
}
