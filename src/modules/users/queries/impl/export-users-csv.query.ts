import { Response } from 'express';
import { IFilterUsers } from '../../interfaces/filter-users.interface';

export class ExportUsersCsvQuery {
  constructor(
    public readonly params: IFilterUsers,
    public readonly response: Response
  ) {}
}
