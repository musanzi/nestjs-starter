import { Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { mockDependency } from '@/shared/helpers';
import { User } from '../../entities/user.entity';
import { FindUserByIdHandler } from '../handlers/find-user-by-id.handler';
import { FindUserByIdQuery } from '../impl/find-user-by-id.query';

describe('FindUserByIdHandler', () => {
  let repository: jest.Mocked<Pick<Repository<User>, 'findOneOrFail'>>;
  let handler: FindUserByIdHandler;
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
    handler = new FindUserByIdHandler(mockDependency<Repository<User>>(repository));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('finds one user by id and maps roles', async () => {
    repository.findOneOrFail.mockResolvedValueOnce(user);

    const result = await handler.execute(new FindUserByIdQuery('user-id'));

    expect(result).toEqual({ ...user, roles: ['admin'] });
    expect(repository.findOneOrFail).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      relations: ['roles']
    });
  });

  it('throws NotFoundException when no user is found', async () => {
    repository.findOneOrFail.mockRejectedValueOnce(new Error('not found'));

    const promise = handler.execute(new FindUserByIdQuery('missing-user-id'));

    await expect(promise).rejects.toThrow(NotFoundException);
    await expect(promise).rejects.toThrow('Utilisateur introuvable');
  });
});
