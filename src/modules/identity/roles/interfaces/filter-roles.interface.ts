import { IPagination } from '@/shared/interfaces/pagination.interface';

export interface IFilterRoles extends IPagination {
  q?: string;
}
