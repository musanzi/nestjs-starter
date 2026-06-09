import { Provider } from '@nestjs/common';
import { FindRoleHandler } from './find-role.handler';
import { FindRolesHandler } from './find-roles.handler';

export const QueryHandlers: Provider[] = [FindRolesHandler, FindRoleHandler];
