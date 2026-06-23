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
import { createCsvUploadOptions } from '@/shared/helpers';
import { CreateUserDto } from '../dto/create-user.dto';
import { IFilterUsers, IUserResponse } from '../interfaces';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { CurrentUser, Roles } from '@/modules/auth/decorators';
import { RoleEnum } from '@/modules/auth/enums';
import { createDiskUploadOptions } from '@/shared/helpers';
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
  @Roles([RoleEnum.ADMIN])
  create(@Body() dto: CreateUserDto): Promise<IUserResponse> {
    return this.commandBus.execute(new CreateUserCommand(dto));
  }

  @Get()
  @Roles([RoleEnum.ADMIN])
  findAll(@Query() query: IFilterUsers): Promise<[IUserResponse[], number]> {
    return this.queryBus.execute(new FindUsersQuery(query));
  }

  @Post('import/csv')
  @Roles([RoleEnum.ADMIN])
  @UseInterceptors(FileInterceptor('file', createCsvUploadOptions()))
  importCsv(@UploadedFile() file: Express.Multer.File): Promise<void> {
    return this.commandBus.execute(new ImportUsersCsvCommand(file));
  }

  @Get('export/csv')
  @Roles([RoleEnum.ADMIN])
  async exportCSV(@Query() query: IFilterUsers, @Res() res: Response): Promise<void> {
    await this.queryBus.execute(new ExportUsersCsvQuery(query, res));
  }

  @Post('profile/avatar')
  @UseInterceptors(FileInterceptor('avatar', createDiskUploadOptions('./uploads/profiles')))
  uploadImage(@CurrentUser() user: User, @UploadedFile() file: Express.Multer.File): Promise<IUserResponse> {
    return this.commandBus.execute(new UploadUserAvatarCommand(user, file));
  }

  @Get(':email')
  @Roles([RoleEnum.ADMIN])
  findOneByEmail(@Param('email') email: string): Promise<IUserResponse> {
    return this.queryBus.execute(new FindUserByEmailQuery(email));
  }

  @Patch(':id')
  @Roles([RoleEnum.ADMIN])
  update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<IUserResponse> {
    return this.commandBus.execute(new UpdateUserCommand(id, dto));
  }

  @Delete(':id')
  @Roles([RoleEnum.ADMIN])
  remove(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new DeleteUserCommand(id));
  }
}
