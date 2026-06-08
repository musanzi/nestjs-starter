import { BadRequestException } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { MailerService } from '@nestjs-modules/mailer';
import { ResetPasswordRequestedEvent } from '../impl';

@EventsHandler(ResetPasswordRequestedEvent)
export class SendResetPasswordEmailHandler implements IEventHandler<ResetPasswordRequestedEvent> {
  constructor(private mailerService: MailerService) {}

  async handle(event: ResetPasswordRequestedEvent): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: event.user.email,
        subject: 'Réinitialisation du mot de passe',
        text: [
          `Bonjour ${event.user.name},`,
          '',
          'Vous avez demande la reinitialisation de votre mot de passe.',
          `Lien: ${event.link}`,
          '',
          "Si vous n'etes pas a l'origine de cette demande, ignorez cet email.",
          '',
          "L'equipe Starter"
        ].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
  }
}
