import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AbstractController } from '@/shared/abstracts';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { IFilterRoles } from '../interfaces';
import { Role } from '../entities/role.entity';
import { HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';
import { CreateRole, DeleteRole, UpdateRole } from '../commands';
import { FindRoleById, FindRoles } from '../queries';

@Controller('roles')
export class RolesController extends AbstractController {
  @Post()
  @HasRoles([Roles.ADMIN])
  create(@Body() dto: CreateRoleDto): Promise<Role> {
    return this.commandHandler.execute(new CreateRole({ ...dto }));
  }

  @Get()
  @HasRoles([Roles.ADMIN])
  findAll(@Query() query: IFilterRoles): Promise<[Role[], number]> {
    return this.queryHandler.execute(new FindRoles(query));
  }

  @Get(':id')
  @HasRoles([Roles.ADMIN])
  findOne(@Param('id') id: string): Promise<Role> {
    return this.queryHandler.execute(new FindRoleById(id));
  }

  @Patch(':id')
  @HasRoles([Roles.ADMIN])
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto): Promise<Role> {
    return this.commandHandler.execute(new UpdateRole(id, { ...updateRoleDto }));
  }

  @Delete(':id')
  @HasRoles([Roles.ADMIN])
  remove(@Param('id') id: string): Promise<void> {
    return this.commandHandler.execute(new DeleteRole(id));
  }
}
