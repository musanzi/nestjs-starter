import { User } from '../../identity/users/entities/user.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthEmailService {
  constructor(private mailerService: MailerService) {}

  @OnEvent('user.welcome')
  async sendWelcomeEmail(user: User): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Bienvenue sur Starter',
        text: [`Bonjour ${user.name},`, '', 'Bienvenue sur Starter.', '', "L'equipe Starter"].join('\n')
      });
    } catch {
      throw new BadRequestException("Envoi d'email impossible");
    }
  }

  @OnEvent('user.reset-password')
  async resetEmail(payload: { user: User; link: string }): Promise<void> {
    try {
      const { user, link } = payload;
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Réinitialisation du mot de passe',
        text: [
          `Bonjour ${user.name},`,
          '',
          'Vous avez demande la reinitialisation de votre mot de passe.',
          `Lien: ${link}`,
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
