import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '@/shared/abstracts';
import { CreateRoleDto, UpdateRoleDto } from '../dto';
import { IFilterRoles, RoleResponse } from '../interfaces';
import { Role } from '../entities/role.entity';
import { HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';
import { CreateRole, DeleteRole, UpdateRole } from '../commands';
import { FindRoleById, FindRoles } from '../queries';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController extends AbstractController {
  @Post()
  @HasRoles([Roles.ADMIN])
  @ApiOperation({ summary: 'Create a role (admin only)' })
  @ApiCreatedResponse({ type: RoleResponse, description: 'Role created' })
  create(@Body() dto: CreateRoleDto): Promise<Role> {
    return this.commandHandler.execute(new CreateRole(dto));
  }

  @Get()
  @HasRoles([Roles.ADMIN])
  @ApiOperation({ summary: 'List roles with pagination (admin only)' })
  @ApiOkResponse({
    description: 'Paginated roles as a [items, total] tuple',
    schema: {
      type: 'array',
      example: [[{ id: 'b7f2c1e0-4a5d-4c8e-9f1a-2b3c4d5e6f7a', name: 'admin' }], 1]
    }
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'take', required: false, example: 10 })
  @ApiQuery({ name: 'q', required: false, example: 'admin' })
  findAll(@Query() query: IFilterRoles): Promise<[Role[], number]> {
    return this.queryHandler.execute(new FindRoles(query));
  }

  @Get(':id')
  @HasRoles([Roles.ADMIN])
  @ApiOperation({ summary: 'Find a role by id (admin only)' })
  @ApiOkResponse({ type: RoleResponse, description: 'Role found' })
  findOne(@Param('id') id: string): Promise<Role> {
    return this.queryHandler.execute(new FindRoleById(id));
  }

  @Patch(':id')
  @HasRoles([Roles.ADMIN])
  @ApiOperation({ summary: 'Update a role (admin only)' })
  @ApiOkResponse({ type: RoleResponse, description: 'Role updated' })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto): Promise<Role> {
    return this.commandHandler.execute(new UpdateRole(id, updateRoleDto));
  }

  @Delete(':id')
  @HasRoles([Roles.ADMIN])
  @ApiOperation({ summary: 'Delete a role (admin only)' })
  @ApiOkResponse({ description: 'Role deleted' })
  remove(@Param('id') id: string): Promise<void> {
    return this.commandHandler.execute(new DeleteRole(id));
  }
}
