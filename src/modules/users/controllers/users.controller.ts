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
import { FileInterceptor } from '@nestjs/platform-express';
import { AbstractController } from '@/shared/abstracts';
import { createCsvUploadOptions } from '@/shared/helpers';
import { CreateUserDto } from '../dto/create-user.dto';
import { IFilterUsers, IUserResponse } from '../interfaces';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { CurrentUser, HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';
import { createDiskUploadOptions } from '@/shared/helpers';
import { Response } from 'express';
import { CreateUser, DeleteUser, ImportUsersCsv, UpdateUser, UploadUserAvatar } from '../commands';
import { ExportUsersCsv, FindUserByEmail, FindUsers } from '../queries';

@Controller('users')
export class UsersController extends AbstractController {
  @Post()
  @HasRoles([Roles.ADMIN])
  create(@Body() dto: CreateUserDto): Promise<IUserResponse> {
    return this.commandHandler.execute(new CreateUser(dto.email, dto.name, dto.password, dto.avatar, dto.roles));
  }

  @Get()
  @HasRoles([Roles.ADMIN])
  findAll(@Query() query: IFilterUsers): Promise<[IUserResponse[], number]> {
    return this.queryHandler.execute(new FindUsers(query));
  }

  @Post('import/csv')
  @HasRoles([Roles.ADMIN])
  @UseInterceptors(FileInterceptor('file', createCsvUploadOptions()))
  importCsv(@UploadedFile() file: Express.Multer.File): Promise<void> {
    return this.commandHandler.execute(new ImportUsersCsv(file));
  }

  @Get('export/csv')
  @HasRoles([Roles.ADMIN])
  async exportCSV(@Query() query: IFilterUsers, @Res() res: Response): Promise<void> {
    await this.queryHandler.execute(new ExportUsersCsv(query, res));
  }

  @Post('profile/avatar')
  @UseInterceptors(FileInterceptor('avatar', createDiskUploadOptions('./uploads/profiles')))
  uploadImage(@CurrentUser() user: User, @UploadedFile() file: Express.Multer.File): Promise<IUserResponse> {
    return this.commandHandler.execute(new UploadUserAvatar(user, file));
  }

  @Get(':email')
  @HasRoles([Roles.ADMIN])
  findOneByEmail(@Param('email') email: string): Promise<IUserResponse> {
    return this.queryHandler.execute(new FindUserByEmail(email));
  }

  @Patch(':id')
  @HasRoles([Roles.ADMIN])
  update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<IUserResponse> {
    return this.commandHandler.execute(
      new UpdateUser(id, dto.email, dto.name, dto.password, dto.avatar, dto.roles)
    );
  }

  @Delete(':id')
  @HasRoles([Roles.ADMIN])
  remove(@Param('id') id: string): Promise<void> {
    return this.commandHandler.execute(new DeleteUser(id));
  }
}
