import { Provider } from '@nestjs/common';
import { ExportUsersCsvHandler } from './export-users-csv.handler';
import { FindUserHandler } from './find-user.handler';
import { FindUsersHandler } from './find-users.handler';

export const QueryHandlers: Provider[] = [FindUsersHandler, FindUserHandler, ExportUsersCsvHandler];
