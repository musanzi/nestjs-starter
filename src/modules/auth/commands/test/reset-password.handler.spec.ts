import { BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { UpdateUserCommand } from '@/modules/users/commands';
import { UserResponse } from '@/modules/users/interfaces';
import { mockDependency } from '../../../../../test/mock-dependency';
import { ResetPasswordCommand } from '../impl/reset-password.command';
import { ResetPasswordHandler } from '../handlers/reset-password.handler';

describe('ResetPasswordHandler', () => {
  let commandBus: jest.Mocked<Pick<CommandBus, 'execute'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'verifyAsync'>>;
  let configService: jest.Mocked<Pick<ConfigService, 'get'>>;
  let handler: ResetPasswordHandler;
  let loggerErrorSpy: jest.SpyInstance;

  const updatedUser = { id: 'user-id', name: 'Ada Lovelace', email: 'ada@example.com', roles: [] } as UserResponse;

  beforeEach(() => {
    commandBus = { execute: jest.fn() };
    jwtService = { verifyAsync: jest.fn() };
    configService = { get: jest.fn().mockReturnValue('jwt-secret') };
    handler = new ResetPasswordHandler(
      mockDependency<CommandBus>(commandBus),
      mockDependency<JwtService>(jwtService),
      mockDependency<ConfigService>(configService)
    );
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('verifies the reset token and updates the user password', async () => {
    jwtService.verifyAsync.mockResolvedValueOnce({ sub: 'user-id' });
    commandBus.execute.mockResolvedValueOnce(updatedUser);

    const result = await handler.execute(new ResetPasswordCommand({ token: 'reset-token', password: 'new-password' }));

    expect(result).toBe(updatedUser);
    expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('reset-token', { secret: 'jwt-secret' });
    expect(commandBus.execute).toHaveBeenCalledWith(new UpdateUserCommand('user-id', { password: 'new-password' }));
  });

  it('throws BadRequestException when reset password handling fails', async () => {
    jwtService.verifyAsync.mockRejectedValueOnce(new Error('invalid token'));
    const promise = handler.execute(new ResetPasswordCommand({ token: 'reset-token', password: 'new-password' }));

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('Mot de passe invalide');
  });
});
