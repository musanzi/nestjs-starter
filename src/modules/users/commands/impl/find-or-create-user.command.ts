import { CreateUserDto } from '../../dto/create-user.dto';

export class FindOrCreateUserCommand {
  constructor(public readonly dto: CreateUserDto) {}
}
