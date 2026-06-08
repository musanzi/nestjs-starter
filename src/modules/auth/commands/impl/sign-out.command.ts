import { Command } from '@nestjs/cqrs';
import { Request } from 'express';

export class SignOutCommand extends Command<void> {
  constructor(public readonly request: Request) {
    super();
  }
}
