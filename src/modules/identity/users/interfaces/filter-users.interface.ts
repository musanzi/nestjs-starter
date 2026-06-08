import { IPagination } from '@/shared/interfaces/pagination.interface';

export interface IFilterUsers extends IPagination {
  q?: string;
}
