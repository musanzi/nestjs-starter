import { Provider } from '@nestjs/common';
import { FindAllRolesHandler } from './find-all-roles.handler';
import { FindPaginatedRolesHandler } from './find-paginated-roles.handler';
import { FindRoleByIdHandler } from './find-role-by-id.handler';
import { FindRoleByNameHandler } from './find-role-by-name.handler';

export const QueryHandlers: Provider[] = [
  FindAllRolesHandler,
  FindPaginatedRolesHandler,
  FindRoleByIdHandler,
  FindRoleByNameHandler
];
