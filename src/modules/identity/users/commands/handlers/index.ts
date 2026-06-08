import { CreateUserHandler } from './create-user.handler';
import { DeleteUserHandler } from './delete-user.handler';
import { ImportUsersCsvHandler } from './import-users-csv.handler';
import { UpdateUserHandler } from './update-user.handler';
import { UploadUserAvatarHandler } from './upload-user-avatar.handler';

export const CommandHandlers = [
  CreateUserHandler,
  UpdateUserHandler,
  DeleteUserHandler,
  ImportUsersCsvHandler,
  UploadUserAvatarHandler
];
