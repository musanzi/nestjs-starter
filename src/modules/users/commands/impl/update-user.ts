import { Command } from '@nestjs/cqrs';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { IUserResponse } from '../../interfaces';

export class UpdateUser extends Command<IUserResponse> {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateUserDto
  ) {
    super();
  }
}
