import { Request } from 'express';

export class SignInQuery {
  constructor(public readonly request: Request) {}
}
