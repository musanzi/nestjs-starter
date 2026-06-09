import { BadRequestException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SendGeneratedPasswordEmailCommand } from '../impl/send-generated-password-email.command';

@CommandHandler(SendGeneratedPasswordEmailCommand)
export class SendGeneratedPasswordEmailHandler implements ICommandHandler<SendGeneratedPasswordEmailCommand, void> {
  constructor(private readonly mailerService: MailerService) {}

  async execute(command: SendGeneratedPasswordEmailCommand): Promise<void> {
    const { user, password } = command;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Mot de passe Starter',
        text: [
          `Bonjour ${user.name},`,
          '',
          'Votre compte Starter a ete cree.',
          `Mot de passe: ${password}`,
          '',
          "L'equipe Starter"
        ].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
  }
}
