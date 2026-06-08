import { IPagination } from '@/modules/database/interfaces/pagination.interface';

export interface IFilterUsers extends IPagination {
  q?: string;
}
