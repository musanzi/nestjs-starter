import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import { createCsvUploadOptions } from '@/shared/helpers/csv-upload.helper';
import { CreateUserDto } from '../dto/create-user.dto';
import { IFilterUsers } from '../interfaces/filter-users.interface';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { CurrentUser, Public, Roles } from '@/modules/auth/decorators';
import { RoleEnum } from '@/modules/auth/enums';
import { createDiskUploadOptions } from '@/shared/helpers/upload.helper';
import { Response } from 'express';
import {
  CreateUserCommand,
  DeleteUserCommand,
  ImportUsersCsvCommand,
  UpdateUserCommand,
  UploadUserAvatarCommand
} from '../commands';
import { ExportUsersCsvQuery, FindUserByEmailQuery, FindUsersQuery } from '../queries';

@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  create(@Body() dto: CreateUserDto): Promise<User> {
    return this.commandBus.execute(new CreateUserCommand(dto));
  }

  @Post('import-csv')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  @UseInterceptors(FileInterceptor('file', createCsvUploadOptions()))
  importCsv(@UploadedFile() file: Express.Multer.File): Promise<void> {
    return this.commandBus.execute(new ImportUsersCsvCommand(file));
  }

  @Get('export/users.csv')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  async exportCSV(@Query() query: IFilterUsers, @Res() res: Response): Promise<void> {
    await this.queryBus.execute(new ExportUsersCsvQuery(query, res));
  }

  @Get()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  findAll(@Query() query: IFilterUsers): Promise<[User[], number]> {
    return this.queryBus.execute(new FindUsersQuery(query));
  }

  @Get('by-email/:email')
  @Public()
  findOneByEmail(@Param('email') email: string): Promise<User> {
    return this.queryBus.execute(new FindUserByEmailQuery(email));
  }

  @Patch('id/:userId')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  update(@Param('userId') userId: string, @Body() dto: UpdateUserDto): Promise<User> {
    return this.commandBus.execute(new UpdateUserCommand(userId, dto));
  }

  @Post('me/profile-image')
  @UseInterceptors(FileInterceptor('profile', createDiskUploadOptions('./uploads/profiles')))
  uploadImage(@CurrentUser() user: User, @UploadedFile() file: Express.Multer.File): Promise<User> {
    return this.commandBus.execute(new UploadUserAvatarCommand(user, file));
  }

  @Delete('id/:userId')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  remove(@Param('userId') userId: string): Promise<void> {
    return this.commandBus.execute(new DeleteUserCommand(userId));
  }
}
