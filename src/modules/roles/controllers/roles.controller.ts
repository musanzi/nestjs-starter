import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { IFilterRoles } from '../interfaces';
import { Role } from '../entities/role.entity';
import { Roles } from '@/modules/auth/decorators';
import { RoleEnum } from '@/modules/auth/enums';
import { CreateRoleCommand, DeleteRoleCommand, UpdateRoleCommand } from '../commands';
import { FindRoleByIdQuery, FindRolesQuery } from '../queries';

@Controller('roles')
export class RolesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  @Roles([RoleEnum.ADMIN])
  create(@Body() dto: CreateRoleDto): Promise<Role> {
    return this.commandBus.execute(new CreateRoleCommand(dto));
  }

  @Get()
  @Roles([RoleEnum.ADMIN])
  findAll(@Query() query: IFilterRoles): Promise<[Role[], number]> {
    return this.queryBus.execute(new FindRolesQuery(query));
  }

  @Get('id/:id')
  @Roles([RoleEnum.ADMIN])
  findOne(@Param('id') id: string): Promise<Role> {
    return this.queryBus.execute(new FindRoleByIdQuery(id));
  }

  @Patch('id/:id')
  @Roles([RoleEnum.ADMIN])
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto): Promise<Role> {
    return this.commandBus.execute(new UpdateRoleCommand(id, updateRoleDto));
  }

  @Delete('id/:id')
  @Roles([RoleEnum.ADMIN])
  remove(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new DeleteRoleCommand(id));
  }
}
