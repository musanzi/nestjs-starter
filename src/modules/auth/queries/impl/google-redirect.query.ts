import { Query } from '@nestjs/cqrs';
import { Response } from 'express';

export class GoogleRedirectQuery extends Query<void> {
  constructor(public readonly response: Response) {
    super();
  }
}
