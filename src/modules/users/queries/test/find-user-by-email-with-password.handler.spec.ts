import { Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { mockDependency } from '@/shared/helpers';
import { User } from '../../entities/user.entity';
import { FindUserByEmailWithPasswordHandler } from '../handlers/find-user-by-email-with-password.handler';
import { FindUserByEmailWithPasswordQuery } from '../impl';

describe('FindUserByEmailWithPasswordHandler', () => {
  let repository: jest.Mocked<Pick<Repository<User>, 'findOneOrFail'>>;
  let handler: FindUserByEmailWithPasswordHandler;
  let loggerErrorSpy: jest.SpyInstance;

  const user = {
    id: 'user-id',
    email: 'ada@example.com',
    password: 'hashed-password'
  } as User;

  beforeEach(() => {
    repository = {
      findOneOrFail: jest.fn()
    };
    handler = new FindUserByEmailWithPasswordHandler(mockDependency<Repository<User>>(repository));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('finds one user by email with password fields only', async () => {
    repository.findOneOrFail.mockResolvedValueOnce(user);

    const result = await handler.execute(new FindUserByEmailWithPasswordQuery('ada@example.com'));

    expect(result).toBe(user);
    expect(repository.findOneOrFail).toHaveBeenCalledWith({
      where: { email: 'ada@example.com' },
      select: ['id', 'email', 'password']
    });
  });

  it('throws NotFoundException when no user is found', async () => {
    repository.findOneOrFail.mockRejectedValueOnce(new Error('not found'));

    const promise = handler.execute(new FindUserByEmailWithPasswordQuery('missing@example.com'));

    await expect(promise).rejects.toThrow(NotFoundException);
    await expect(promise).rejects.toThrow('Utilisateur introuvable');
  });
});
