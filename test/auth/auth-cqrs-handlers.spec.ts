import { BadRequestException } from '@nestjs/common';
import { ForgotPasswordHandler } from '@/modules/auth/commands/handlers/forgot-password.handler';
import { ResetPasswordHandler } from '@/modules/auth/commands/handlers/reset-password.handler';
import { SignOutHandler } from '@/modules/auth/commands/handlers/sign-out.handler';
import { SignUpHandler } from '@/modules/auth/commands/handlers/sign-up.handler';
import { UpdatePasswordHandler } from '@/modules/auth/commands/handlers/update-password.handler';
import { UpdateProfileHandler } from '@/modules/auth/commands/handlers/update-profile.handler';
import {
  ForgotPasswordCommand,
  ResetPasswordCommand,
  SignOutCommand,
  SignUpCommand,
  UpdatePasswordCommand,
  UpdateProfileCommand
} from '@/modules/auth/commands';
import { GoogleRedirectHandler } from '@/modules/auth/queries/handlers/google-redirect.handler';
import { ProfileHandler } from '@/modules/auth/queries/handlers/profile.handler';
import { SignInHandler } from '@/modules/auth/queries/handlers/sign-in.handler';
import { GoogleRedirectQuery, ProfileQuery, SignInQuery } from '@/modules/auth/queries';

describe('Auth CQRS handlers', () => {
  let usersService: any;
  let eventEmitter: any;
  let jwtService: any;
  let configService: any;

  beforeEach(() => {
    usersService = {
      signUp: jest.fn(),
      update: jest.fn(),
      findByEmail: jest.fn()
    };
    eventEmitter = { emit: jest.fn() };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('token'),
      verifyAsync: jest.fn()
    };
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'secret';
        if (key === 'FRONTEND_URI') return 'https://app.example.com';
        return undefined;
      })
    };
  });

  describe('commands', () => {
    it('signs users up through the users facade', async () => {
      usersService.signUp.mockResolvedValue({ id: 'u1' });
      const handler = new SignUpHandler(usersService);

      await expect(
        handler.execute(new SignUpCommand({ email: 'ada@example.com', password: 'secret123' }))
      ).resolves.toEqual({
        id: 'u1'
      });
      expect(usersService.signUp).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'secret123' });
    });

    it('maps sign up failures to bad requests', async () => {
      usersService.signUp.mockRejectedValue(new Error('Cet utilisateur existe déjà'));
      const handler = new SignUpHandler(usersService);

      await expect(
        handler.execute(new SignUpCommand({ email: 'ada@example.com', password: 'secret123' }))
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('destroys the active session on sign out', async () => {
      const destroy = jest.fn((callback) => callback());
      const handler = new SignOutHandler();

      await handler.execute(new SignOutCommand({ session: { destroy } } as any));
      expect(destroy).toHaveBeenCalled();
    });

    it('updates the current user profile', async () => {
      usersService.update.mockResolvedValue({ id: 'u1', name: 'Ada' });
      const handler = new UpdateProfileHandler(usersService);

      await expect(handler.execute(new UpdateProfileCommand({ id: 'u1' } as any, { name: 'Ada' }))).resolves.toEqual({
        id: 'u1',
        name: 'Ada'
      });
      expect(usersService.update).toHaveBeenCalledWith('u1', { name: 'Ada' });
    });

    it('updates the current user password and reloads the user', async () => {
      usersService.update.mockResolvedValue({ id: 'u1' });
      usersService.findByEmail.mockResolvedValue({ id: 'u1', email: 'ada@example.com' });
      const handler = new UpdatePasswordHandler(usersService);

      await expect(
        handler.execute(
          new UpdatePasswordCommand({ id: 'u1', email: 'ada@example.com' } as any, { password: 'secret123' })
        )
      ).resolves.toEqual({ id: 'u1', email: 'ada@example.com' });
      expect(usersService.update).toHaveBeenCalledWith('u1', { password: 'secret123' });
      expect(usersService.findByEmail).toHaveBeenCalledWith('ada@example.com');
    });

    it('emits reset password email payloads with a short-lived token', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'u1', name: 'Ada', email: 'ada@example.com' });
      const handler = new ForgotPasswordHandler(usersService, eventEmitter, jwtService, configService);

      await expect(handler.execute(new ForgotPasswordCommand({ email: 'ada@example.com' }))).resolves.toBeUndefined();
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 'u1', name: 'Ada', email: 'ada@example.com' },
        { secret: 'secret', expiresIn: '15m' }
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('user.reset-password', {
        user: { id: 'u1', name: 'Ada', email: 'ada@example.com' },
        link: 'https://app.example.com/reset-password?token=token'
      });
    });

    it('resets passwords from valid tokens', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'u1' });
      usersService.update.mockResolvedValue({ id: 'u1' });
      const handler = new ResetPasswordHandler(usersService, jwtService, configService);

      await expect(
        handler.execute(new ResetPasswordCommand({ token: 'token', password: 'secret123' }))
      ).resolves.toEqual({ id: 'u1' });
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('token', { secret: 'secret' });
      expect(usersService.update).toHaveBeenCalledWith('u1', { password: 'secret123' });
    });
  });

  describe('queries', () => {
    it('returns the passport-authenticated user on sign in', async () => {
      const handler = new SignInHandler();

      await expect(handler.execute(new SignInQuery({ user: { id: 'u1' } } as any))).resolves.toEqual({ id: 'u1' });
    });

    it('redirects google callbacks to the frontend uri', async () => {
      const redirect = jest.fn();
      const handler = new GoogleRedirectHandler(configService);

      await handler.execute(new GoogleRedirectQuery({ redirect } as any));
      expect(redirect).toHaveBeenCalledWith('https://app.example.com');
    });

    it('loads the current user profile by email', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'u1', email: 'ada@example.com' });
      const handler = new ProfileHandler(usersService);

      await expect(handler.execute(new ProfileQuery({ email: 'ada@example.com' } as any))).resolves.toEqual({
        id: 'u1',
        email: 'ada@example.com'
      });
    });
  });
});
