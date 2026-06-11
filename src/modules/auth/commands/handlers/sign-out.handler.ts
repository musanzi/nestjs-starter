import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SignOutCommand } from '../impl';

@CommandHandler(SignOutCommand)
export class SignOutHandler implements ICommandHandler<SignOutCommand, void> {
  async execute(command: SignOutCommand): Promise<void> {
    command.request.session.destroy(() => {});
  }
}
