import { BadRequestException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { mockDependency } from '../../../../../test/mock-dependency';
import { SendGeneratedPasswordEmailCommand } from '../impl/send-generated-password-email.command';
import { SendGeneratedPasswordEmailHandler } from './send-generated-password-email.handler';

describe('SendGeneratedPasswordEmailHandler', () => {
  let mailerService: jest.Mocked<Pick<MailerService, 'sendMail'>>;
  let handler: SendGeneratedPasswordEmailHandler;

  beforeEach(() => {
    mailerService = {
      sendMail: jest.fn()
    };
    handler = new SendGeneratedPasswordEmailHandler(mockDependency<MailerService>(mailerService));
  });

  it('sends the generated password email payload', async () => {
    mailerService.sendMail.mockResolvedValueOnce(undefined);

    await handler.execute(
      new SendGeneratedPasswordEmailCommand({ name: 'Ada Lovelace', email: 'ada@example.com' }, '123456')
    );

    expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: 'ada@example.com',
      subject: 'Mot de passe Starter',
      text: [
        'Bonjour Ada Lovelace,',
        '',
        'Votre compte Starter a ete cree.',
        'Mot de passe: 123456',
        '',
        "L'equipe Starter"
      ].join('\n')
    });
  });

  it('throws BadRequestException when the generated password email cannot be sent', async () => {
    mailerService.sendMail.mockRejectedValueOnce(new Error('SMTP unavailable'));

    await expect(
      handler.execute(
        new SendGeneratedPasswordEmailCommand({ name: 'Ada Lovelace', email: 'ada@example.com' }, '123456')
      )
    ).rejects.toThrow(BadRequestException);
  });
});
