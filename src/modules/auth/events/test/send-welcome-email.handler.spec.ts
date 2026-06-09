import { BadRequestException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { mockDependency } from '../../../../../test/mock-dependency';
import { WelcomeUserEvent } from '../impl';
import { SendWelcomeEmailHandler } from '../handlers/send-welcome-email.handler';

describe('SendWelcomeEmailHandler', () => {
  let mailerService: jest.Mocked<Pick<MailerService, 'sendMail'>>;
  let handler: SendWelcomeEmailHandler;

  beforeEach(() => {
    mailerService = {
      sendMail: jest.fn()
    };
    handler = new SendWelcomeEmailHandler(mockDependency<MailerService>(mailerService));
  });

  it('sends the welcome email payload', async () => {
    mailerService.sendMail.mockResolvedValueOnce(undefined);

    await handler.handle(new WelcomeUserEvent({ name: 'Ada Lovelace', email: 'ada@example.com' }));

    expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: 'ada@example.com',
      subject: 'Bienvenue sur Starter',
      html: expect.stringContaining('Votre compte a bien été créé'),
      text: expect.stringContaining('Votre compte a bien été créé')
    });
  });

  it('includes the default password when provided', async () => {
    mailerService.sendMail.mockResolvedValueOnce(undefined);

    await handler.handle(new WelcomeUserEvent({ name: 'Ada Lovelace', email: 'ada@example.com' }, '123456'));

    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: 'ada@example.com',
      subject: 'Bienvenue sur Starter',
      html: expect.stringContaining('123456'),
      text: expect.stringContaining('123456')
    });
  });

  it('throws BadRequestException when the welcome email cannot be sent', async () => {
    mailerService.sendMail.mockRejectedValueOnce(new Error('SMTP unavailable'));

    await expect(
      handler.handle(new WelcomeUserEvent({ name: 'Ada Lovelace', email: 'ada@example.com' }))
    ).rejects.toThrow(BadRequestException);
  });
});
