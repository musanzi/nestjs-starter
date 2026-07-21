import { CommandBus, QueryBus } from '@nestjs/cqrs';

export abstract class AbstractController {
  protected constructor(
    protected readonly commandBus: CommandBus,
    protected readonly queryBus: QueryBus
  ) {}
}
