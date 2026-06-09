import { Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { mockDependency } from '@/shared/helpers';
import { User } from '../../entities/user.entity';
import { FindUserHandler } from '../handlers/find-user.handler';
import { FindUserQuery } from '../impl/find-user.query';

describe('FindUserHandler', () => {
  let repository: jest.Mocked<Pick<Repository<User>, 'findOneOrFail'>>;
  let handler: FindUserHandler;
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
    handler = new FindUserHandler(mockDependency<Repository<User>>(repository));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('finds one user with the provided options and maps roles', async () => {
    repository.findOneOrFail.mockResolvedValueOnce(user);

    const result = await handler.execute(new FindUserQuery({ where: { email: 'ada@example.com' } }));

    expect(result).toEqual({ ...user, roles: ['admin'] });
    expect(repository.findOneOrFail).toHaveBeenCalledWith({
      where: { email: 'ada@example.com' },
      relations: ['roles']
    });
  });

  it('preserves select options while loading roles', async () => {
    repository.findOneOrFail.mockResolvedValueOnce({ ...user, password: 'hashed-password' } as User);

    await handler.execute(
      new FindUserQuery({
        where: { email: 'ada@example.com' },
        select: ['id', 'email', 'password']
      })
    );

    expect(repository.findOneOrFail).toHaveBeenCalledWith({
      where: { email: 'ada@example.com' },
      select: ['id', 'email', 'password'],
      relations: ['roles']
    });
  });

  it('throws NotFoundException when no user is found', async () => {
    repository.findOneOrFail.mockRejectedValueOnce(new Error('not found'));

    const promise = handler.execute(new FindUserQuery({ where: { id: 'missing-user-id' } }));

    await expect(promise).rejects.toThrow(NotFoundException);
    await expect(promise).rejects.toThrow('Utilisateur introuvable');
  });
});
