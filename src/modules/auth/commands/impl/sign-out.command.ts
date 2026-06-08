import { Request } from 'express';

export class SignOutCommand {
  constructor(public readonly request: Request) {}
}
