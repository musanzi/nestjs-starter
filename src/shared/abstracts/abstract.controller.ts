import { CommandBus, QueryBus } from '@nestjs/cqrs';

export abstract class AbstractController {
  protected constructor(
    protected readonly commandHandler: CommandBus,
    protected readonly queryHandler: QueryBus
  ) {}
}
