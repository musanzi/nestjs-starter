import { Request } from 'express';
import { IUserResponse } from '@/modules/users/interfaces';
import { mockDependency } from '@/shared/helpers';
import { SignInQuery } from '../impl';
import { SignInHandler } from '../handlers/sign-in.handler';

describe('SignInHandler', () => {
  it('returns the authenticated request user', async () => {
    const user = { id: 'user-id', name: 'Ada Lovelace', email: 'ada@example.com', roles: [] } as IUserResponse;
    const request = mockDependency<Request>({ user });
    const handler = new SignInHandler();

    const result = await handler.execute(new SignInQuery(request));

    expect(result).toBe(user);
  });
});
