import { BadRequestException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { mockDependency } from '@/shared/helpers';
import { ResetPasswordRequestedEvent } from '../impl';
import { SendResetPasswordEmailHandler } from '../handlers/send-reset-password-email.handler';

describe('SendResetPasswordEmailHandler', () => {
  let mailerService: jest.Mocked<Pick<MailerService, 'sendMail'>>;
  let handler: SendResetPasswordEmailHandler;

  beforeEach(() => {
    mailerService = {
      sendMail: jest.fn()
    };
    handler = new SendResetPasswordEmailHandler(mockDependency<MailerService>(mailerService));
  });

  it('sends the reset password email payload', async () => {
    mailerService.sendMail.mockResolvedValueOnce(undefined);

    await handler.handle(
      new ResetPasswordRequestedEvent({ name: 'Ada Lovelace', email: 'ada@example.com' }, 'https://example.com/reset')
    );

    expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: 'ada@example.com',
      subject: 'Réinitialisation du mot de passe',
      html: expect.stringContaining('Réinitialiser mon mot de passe'),
      text: expect.stringContaining("Si vous n'êtes pas à l'origine de cette demande")
    });
  });

  it('throws BadRequestException when the reset password email cannot be sent', async () => {
    mailerService.sendMail.mockRejectedValueOnce(new Error('SMTP unavailable'));

    await expect(
      handler.handle(
        new ResetPasswordRequestedEvent({ name: 'Ada Lovelace', email: 'ada@example.com' }, 'https://example.com/reset')
      )
    ).rejects.toThrow(BadRequestException);
  });
});
