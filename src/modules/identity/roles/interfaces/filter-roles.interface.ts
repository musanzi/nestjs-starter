import { IPagination } from '@/modules/database/interfaces/pagination.interface';

export interface IFilterRoles extends IPagination {
  q?: string;
}
