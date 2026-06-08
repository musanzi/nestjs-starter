import { Response } from 'express';

export class GoogleRedirectQuery {
  constructor(public readonly response: Response) {}
}
