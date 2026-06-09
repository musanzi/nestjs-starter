import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { mockDependency } from '../../../../../test/mock-dependency';
import { GoogleRedirectQuery } from '../impl/google-redirect.query';
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
});
