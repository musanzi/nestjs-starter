import { User } from '../../entities/user.entity';

export class UploadUserAvatarCommand {
  constructor(
    public readonly currentUser: User,
    public readonly file: Express.Multer.File
  ) {}
}
