import { CommandBus, QueryBus } from '@nestjs/cqrs';

export abstract class AbstractController {
  constructor(
    protected readonly commandHandler: CommandBus,
    protected readonly queryHandler: QueryBus
  ) {}
}
