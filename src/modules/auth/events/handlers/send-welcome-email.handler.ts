import { BadRequestException } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { MailerService } from '@nestjs-modules/mailer';
import { WelcomeUserEvent } from '../impl';

@EventsHandler(WelcomeUserEvent)
export class SendWelcomeEmailHandler implements IEventHandler<WelcomeUserEvent> {
  constructor(private mailerService: MailerService) {}

  async handle(event: WelcomeUserEvent): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: event.user.email,
        subject: 'Bienvenue sur Starter',
        text: [`Bonjour ${event.user.name},`, '', 'Bienvenue sur Starter.', '', "L'equipe Starter"].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
  }
}
