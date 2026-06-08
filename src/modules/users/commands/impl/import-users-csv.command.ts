import { Command } from '@nestjs/cqrs';

export class ImportUsersCsvCommand extends Command<void> {
  constructor(public readonly file: Express.Multer.File) {
    super();
  }
}
