import { Command } from '@nestjs/cqrs';
import { User } from '../../entities/user.entity';
import { UserResponse } from '../../interfaces';

export class UploadUserAvatarCommand extends Command<UserResponse> {
  constructor(
    public readonly currentUser: User,
    public readonly file: Express.Multer.File
  ) {
    super();
  }
}
