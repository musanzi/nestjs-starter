import { Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { mockDependency } from '@/shared/helpers';
import { User } from '../../entities/user.entity';
import { FindUserByEmailHandler } from '../handlers/find-user-by-email.handler';
import { FindUserByEmailQuery } from '../impl';

describe('FindUserByEmailHandler', () => {
  let repository: jest.Mocked<Pick<Repository<User>, 'findOneOrFail'>>;
  let handler: FindUserByEmailHandler;
  let loggerErrorSpy: jest.SpyInstance;

  const user = {
    id: 'user-id',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    roles: [{ id: 'role-id', name: 'admin' }]
  } as User;

  beforeEach(() => {
    repository = {
      findOneOrFail: jest.fn()
    };
    handler = new FindUserByEmailHandler(mockDependency<Repository<User>>(repository));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('finds one user by email and maps roles', async () => {
    repository.findOneOrFail.mockResolvedValueOnce(user);

    const result = await handler.execute(new FindUserByEmailQuery('ada@example.com'));

    expect(result).toEqual({ ...user, roles: ['admin'] });
    expect(repository.findOneOrFail).toHaveBeenCalledWith({
      where: { email: 'ada@example.com' },
      relations: ['roles']
    });
  });

  it('throws NotFoundException when no user is found', async () => {
    repository.findOneOrFail.mockRejectedValueOnce(new Error('not found'));

    const promise = handler.execute(new FindUserByEmailQuery('missing@example.com'));

    await expect(promise).rejects.toThrow(NotFoundException);
    await expect(promise).rejects.toThrow('Utilisateur introuvable');
  });
});
