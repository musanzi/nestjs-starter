import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { mockDependency } from '@/shared/helpers';
import { GoogleRedirectQuery } from '../impl';
import { GoogleRedirectHandler } from '../handlers/google-redirect.handler';

describe('GoogleRedirectHandler', () => {
  it('redirects to the configured frontend URI', async () => {
    const configService = { get: jest.fn().mockReturnValue('https://app.example.com') };
    const response = mockDependency<Response>({ redirect: jest.fn() });
    const handler = new GoogleRedirectHandler(mockDependency<ConfigService>(configService));

    await handler.execute(new GoogleRedirectQuery(response));

    expect(configService.get).toHaveBeenCalledWith('FRONTEND_URI');
    expect(response.redirect).toHaveBeenCalledWith('https://app.example.com');
  });

  it('redirects to the configured admin URI when the OAuth state targets admin', async () => {
    const configService = {
      get: jest.fn((key: string) => (key === 'ADMIN_URI' ? 'https://admin.example.com' : 'https://app.example.com'))
    };
    const response = mockDependency<Response>({ redirect: jest.fn() });
    const handler = new GoogleRedirectHandler(mockDependency<ConfigService>(configService));

    await handler.execute(new GoogleRedirectQuery(response, 'admin'));

    expect(configService.get).toHaveBeenCalledWith('FRONTEND_URI');
    expect(configService.get).toHaveBeenCalledWith('ADMIN_URI');
    expect(response.redirect).toHaveBeenCalledWith('https://admin.example.com');
  });

  it('falls back to the frontend URI when admin is targeted but ADMIN_URI is not configured', async () => {
    const configService = {
      get: jest.fn((key: string) => (key === 'ADMIN_URI' ? undefined : 'https://app.example.com'))
    };
    const response = mockDependency<Response>({ redirect: jest.fn() });
    const handler = new GoogleRedirectHandler(mockDependency<ConfigService>(configService));

    await handler.execute(new GoogleRedirectQuery(response, 'admin'));

    expect(response.redirect).toHaveBeenCalledWith('https://app.example.com');
  });

  it('falls back to the frontend URI when the OAuth state target is invalid', async () => {
    const configService = { get: jest.fn().mockReturnValue('https://app.example.com') };
    const response = mockDependency<Response>({ redirect: jest.fn() });
    const handler = new GoogleRedirectHandler(mockDependency<ConfigService>(configService));

    await handler.execute(new GoogleRedirectQuery(response, 'dashboard'));

    expect(configService.get).not.toHaveBeenCalledWith('ADMIN_URI');
    expect(response.redirect).toHaveBeenCalledWith('https://app.example.com');
  });
});
