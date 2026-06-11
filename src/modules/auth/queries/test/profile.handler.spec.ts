import { QueryBus } from '@nestjs/cqrs';
import { User } from '@/modules/users/entities/user.entity';
import { IUserResponse } from '@/modules/users/interfaces';
import { FindUserByEmailQuery } from '@/modules/users/queries';
import { mockDependency } from '@/shared/helpers';
import { ProfileQuery } from '../impl/profile.query';
import { ProfileHandler } from '../handlers/profile.handler';

describe('ProfileHandler', () => {
  it('returns the current user profile by email', async () => {
    const queryBus = { execute: jest.fn() };
    const currentUser = { id: 'user-id', email: 'ada@example.com' } as User;
    const profile = { id: 'user-id', name: 'Ada Lovelace', email: 'ada@example.com', roles: [] } as IUserResponse;
    const handler = new ProfileHandler(mockDependency<QueryBus>(queryBus));
    queryBus.execute.mockResolvedValueOnce(profile);

    const result = await handler.execute(new ProfileQuery(currentUser));

    expect(result).toBe(profile);
    expect(queryBus.execute).toHaveBeenCalledWith(new FindUserByEmailQuery('ada@example.com'));
  });
});
