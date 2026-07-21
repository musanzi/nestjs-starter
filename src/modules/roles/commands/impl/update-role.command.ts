import { Command } from '@nestjs/cqrs';
import { UpdateRoleDto } from '../../dto/update-role.dto';
import { Role } from '../../entities/role.entity';

export class UpdateRole extends Command<Role> {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateRoleDto
  ) {
    super();
  }
}
