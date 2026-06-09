import { Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { mockDependency } from '../../../../../test/mock-dependency';
import { User } from '../../entities/user.entity';
import { FindUserByEmailQuery } from '../impl/find-user-by-email.query';
import { FindUserByEmailHandler } from '../handlers/find-user-by-email.handler';

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
    repository = { findOneOrFail: jest.fn() };
    handler = new FindUserByEmailHandler(mockDependency<Repository<User>>(repository));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('returns a mapped user by email', async () => {
    repository.findOneOrFail.mockResolvedValueOnce(user);

    const result = await handler.execute(new FindUserByEmailQuery('ada@example.com'));

    expect(result).toEqual({ ...user, roles: ['admin'] });
    expect(repository.findOneOrFail).toHaveBeenCalledWith({
      where: { email: 'ada@example.com' },
      relations: ['roles']
    });
  });

  it('throws NotFoundException unchanged when repository raises it', async () => {
    repository.findOneOrFail.mockRejectedValueOnce(new NotFoundException('Utilisateur introuvable'));
    const promise = handler.execute(new FindUserByEmailQuery('ada@example.com'));

    await expect(promise).rejects.toThrow(NotFoundException);
    await expect(promise).rejects.toThrow('Utilisateur introuvable');
  });

  it('throws NotFoundException when the user cannot be found', async () => {
    repository.findOneOrFail.mockRejectedValueOnce(new Error('not found'));
    const promise = handler.execute(new FindUserByEmailQuery('ada@example.com'));

    await expect(promise).rejects.toThrow(NotFoundException);
    await expect(promise).rejects.toThrow("Cet utilisateur n'existe pas");
  });
});
