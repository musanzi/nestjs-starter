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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { AbstractController } from '@/shared/abstracts';
import { createCsvUploadOptions } from '@/shared/helpers';
import { CreateUserDto, UpdateUserDto } from '../dto';
import { IFilterUsers, IUserResponse, UserResponse } from '../interfaces';
import { User } from '../entities/user.entity';
import { CurrentUser, HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';
import { createDiskUploadOptions } from '@/shared/helpers';
import { Response } from 'express';
import { CreateUser, DeleteUser, ImportUsersCsv, UpdateUser, UploadUserAvatar } from '../commands';
import { ExportUsersCsv, FindUserByEmail, FindUsers } from '../queries';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController extends AbstractController {
  @Post()
  @HasRoles([Roles.ADMIN])
  @ApiOperation({ summary: 'Create a user (admin only)' })
  @ApiCreatedResponse({ type: UserResponse, description: 'User created' })
  create(@Body() dto: CreateUserDto): Promise<IUserResponse> {
    return this.commandHandler.execute(new CreateUser(dto));
  }

  @Get()
  @HasRoles([Roles.ADMIN])
  @ApiOperation({ summary: 'List users with pagination (admin only)' })
  @ApiOkResponse({
    description: 'Paginated users as a [items, total] tuple',
    schema: {
      type: 'array',
      example: [[{ id: 'b7f2c1e0-4a5d-4c8e-9f1a-2b3c4d5e6f7a', email: 'john.doe@example.com' }], 1]
    }
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'take', required: false, example: 10 })
  @ApiQuery({ name: 'q', required: false, example: 'john' })
  findAll(@Query() query: IFilterUsers): Promise<[IUserResponse[], number]> {
    return this.queryHandler.execute(new FindUsers(query));
  }

  @Post('import/csv')
  @HasRoles([Roles.ADMIN])
  @UseInterceptors(FileInterceptor('file', createCsvUploadOptions()))
  @ApiOperation({ summary: 'Import users from a CSV file (admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } }
    }
  })
  @ApiOkResponse({ description: 'Users imported' })
  importCsv(@UploadedFile() file: Express.Multer.File): Promise<void> {
    return this.commandHandler.execute(new ImportUsersCsv(file));
  }

  @Get('export/csv')
  @HasRoles([Roles.ADMIN])
  @ApiOperation({ summary: 'Export users as a CSV file (admin only)' })
  @ApiOkResponse({
    description: 'CSV file',
    schema: { type: 'string', format: 'binary' }
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'take', required: false, example: 10 })
  @ApiQuery({ name: 'q', required: false, example: 'john' })
  async exportCSV(@Query() query: IFilterUsers, @Res() res: Response): Promise<void> {
    await this.queryHandler.execute(new ExportUsersCsv(query, res));
  }

  @Post('profile/avatar')
  @UseInterceptors(FileInterceptor('avatar', createDiskUploadOptions('./uploads/profiles')))
  @ApiOperation({ summary: 'Upload the current user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { avatar: { type: 'string', format: 'binary' } }
    }
  })
  @ApiOkResponse({ type: UserResponse, description: 'Avatar uploaded' })
  uploadImage(@CurrentUser() user: User, @UploadedFile() file: Express.Multer.File): Promise<IUserResponse> {
    return this.commandHandler.execute(new UploadUserAvatar(user.id, file));
  }

  @Get(':email')
  @HasRoles([Roles.ADMIN])
  @ApiOperation({ summary: 'Find a user by email (admin only)' })
  @ApiOkResponse({ type: UserResponse, description: 'User found' })
  findOneByEmail(@Param('email') email: string): Promise<IUserResponse> {
    return this.queryHandler.execute(new FindUserByEmail(email));
  }

  @Patch(':id')
  @HasRoles([Roles.ADMIN])
  @ApiOperation({ summary: 'Update a user (admin only)' })
  @ApiOkResponse({ type: UserResponse, description: 'User updated' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<IUserResponse> {
    return this.commandHandler.execute(new UpdateUser(id, dto));
  }

  @Delete(':id')
  @HasRoles([Roles.ADMIN])
  @ApiOperation({ summary: 'Delete a user (admin only)' })
  @ApiOkResponse({ description: 'User deleted' })
  remove(@Param('id') id: string): Promise<void> {
    return this.commandHandler.execute(new DeleteUser(id));
  }
}
