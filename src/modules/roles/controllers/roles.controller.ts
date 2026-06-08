import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { IFilterRoles } from '../interfaces/filter-roles.interface';
import { Roles } from '@/modules/auth/decorators';
import { RoleEnum } from '@/modules/auth/enums';
import { CreateRoleCommand, DeleteRoleCommand, UpdateRoleCommand } from '../commands';
import { FindAllRolesQuery, FindPaginatedRolesQuery, FindRoleByIdQuery } from '../queries';

@Controller('roles')
export class RolesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  create(@Body() dto: CreateRoleDto) {
    return this.commandBus.execute(new CreateRoleCommand(dto));
  }

  @Get('paginated')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  findPaginated(@Query() query: IFilterRoles) {
    return this.queryBus.execute(new FindPaginatedRolesQuery(query));
  }

  @Get()
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  findAll() {
    return this.queryBus.execute(new FindAllRolesQuery());
  }

  @Get('id/:id')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  findOne(@Param('id') id: string) {
    return this.queryBus.execute(new FindRoleByIdQuery(id));
  }

  @Patch('id/:id')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.commandBus.execute(new UpdateRoleCommand(id, updateRoleDto));
  }

  @Delete('id/:id')
  @Roles([RoleEnum.ADMIN, RoleEnum.STAFF])
  remove(@Param('id') id: string) {
    return this.commandBus.execute(new DeleteRoleCommand(id));
  }
}
