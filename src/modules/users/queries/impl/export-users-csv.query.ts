import { Query } from '@nestjs/cqrs';
import { Response } from 'express';
import { FilterUsersDto } from '../../dto';

export class ExportUsersCsv extends Query<void> {
  constructor(
    public readonly params: FilterUsersDto,
    public readonly response: Response
  ) {
    super();
  }
}
