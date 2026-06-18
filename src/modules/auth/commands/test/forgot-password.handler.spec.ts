import { BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBus, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { FindUserByEmailQuery } from '@/modules/users/queries';
import { mockDependency } from '@/shared/helpers';
import { ResetPasswordRequestedEvent } from '../../events';
import { ForgotPasswordCommand } from '../impl';
import { ForgotPasswordHandler } from '../handlers/forgot-password.handler';

describe('ForgotPasswordHandler', () => {
  let queryBus: jest.Mocked<Pick<QueryBus, 'execute'>>;
  let eventBus: jest.Mocked<Pick<EventBus, 'publish'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;
  let configService: jest.Mocked<Pick<ConfigService, 'get'>>;
  let handler: ForgotPasswordHandler;
  let loggerErrorSpy: jest.SpyInstance;

  const user = { id: 'user-id', name: 'Ada Lovelace', email: 'ada@example.com' };

  beforeEach(() => {
    queryBus = { execute: jest.fn() };
    eventBus = { publish: jest.fn() };
    jwtService = { signAsync: jest.fn() };
    configService = {
      get: jest.fn((key: string) => (key === 'JWT_SECRET' ? 'jwt-secret' : 'https://app.example.com'))
    };
    handler = new ForgotPasswordHandler(
      mockDependency<QueryBus>(queryBus),
      mockDependency<EventBus>(eventBus),
      mockDependency<JwtService>(jwtService),
      mockDependency<ConfigService>(configService)
    );
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('publishes a reset password event with a generated reset link', async () => {
    queryBus.execute.mockResolvedValueOnce(user);
    jwtService.signAsync.mockResolvedValueOnce('reset-token');

    await handler.execute(new ForgotPasswordCommand({ email: 'ada@example.com' }));

    expect(queryBus.execute).toHaveBeenCalledWith(new FindUserByEmailQuery('ada@example.com'));
    expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { sub: 'user-id', name: 'Ada Lovelace', email: 'ada@example.com' },
      { secret: 'jwt-secret', expiresIn: '15m' }
    );
    expect(configService.get).toHaveBeenCalledWith('FRONTEND_URI');
    expect(eventBus.publish).toHaveBeenCalledWith(
      new ResetPasswordRequestedEvent(user, 'https://app.example.com/auth/reset-password?token=reset-token')
    );
  });

  it('throws BadRequestException when reset password request handling fails', async () => {
    queryBus.execute.mockRejectedValueOnce(new Error('database unavailable'));
    const promise = handler.execute(new ForgotPasswordCommand({ email: 'ada@example.com' }));

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('Demande invalide');
  });
});
