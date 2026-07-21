import { Command } from '@nestjs/cqrs';
import { User } from '../../entities/user.entity';
import { IUserResponse } from '../../interfaces';

export class UploadUserAvatar extends Command<IUserResponse> {
  constructor(
    public readonly currentUser: User,
    public readonly file: Express.Multer.File
  ) {
    super();
  }
}
