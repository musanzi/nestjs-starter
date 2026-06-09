import { BadRequestException, Logger } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { mockDependency } from '@/shared/helpers';
import { User } from '../../entities/user.entity';
import { FindUsersQuery } from '../impl/find-users.query';
import { FindUsersHandler } from '../handlers/find-users.handler';

describe('FindUsersHandler', () => {
  let repository: jest.Mocked<Pick<Repository<User>, 'createQueryBuilder' | 'findAndCount'>>;
  let queryBuilder: jest.Mocked<
    Pick<SelectQueryBuilder<User>, 'leftJoinAndSelect' | 'orderBy' | 'where' | 'skip' | 'take' | 'getManyAndCount'>
  >;
  let handler: FindUsersHandler;
  let loggerErrorSpy: jest.SpyInstance;

  const users = [
    {
      id: 'user-id',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      roles: [{ id: 'role-id', name: 'admin' }]
    }
  ] as User[];

  beforeEach(() => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn(),
      orderBy: jest.fn(),
      where: jest.fn(),
      skip: jest.fn(),
      take: jest.fn(),
      getManyAndCount: jest.fn()
    };
    queryBuilder.leftJoinAndSelect.mockReturnValue(mockDependency<SelectQueryBuilder<User>>(queryBuilder));
    queryBuilder.orderBy.mockReturnValue(mockDependency<SelectQueryBuilder<User>>(queryBuilder));
    queryBuilder.where.mockReturnValue(mockDependency<SelectQueryBuilder<User>>(queryBuilder));
    queryBuilder.skip.mockReturnValue(mockDependency<SelectQueryBuilder<User>>(queryBuilder));
    queryBuilder.take.mockReturnValue(mockDependency<SelectQueryBuilder<User>>(queryBuilder));
    repository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findAndCount: jest.fn()
    };
    handler = new FindUsersHandler(mockDependency<Repository<User>>(repository));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('returns paginated mapped users using the requested page, limit, and search query', async () => {
    queryBuilder.getManyAndCount.mockResolvedValueOnce([users, 1]);

    const result = await handler.execute(new FindUsersQuery({ page: 2, limit: 25, q: 'ada' }));

    expect(result).toEqual([[{ ...users[0], roles: ['admin'] }], 1]);
    expect(repository.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('user.roles', 'roles');
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('user.updated_at', 'DESC');
    expect(queryBuilder.where).toHaveBeenCalledWith('user.name LIKE :q OR user.email LIKE :q', { q: '%ada%' });
    expect(queryBuilder.skip).toHaveBeenCalledWith(25);
    expect(queryBuilder.take).toHaveBeenCalledWith(25);
    expect(queryBuilder.getManyAndCount).toHaveBeenCalledTimes(1);
  });

  it('returns all mapped users without pagination when no query params are provided', async () => {
    repository.findAndCount.mockResolvedValueOnce([users, 1]);

    const result = await handler.execute(new FindUsersQuery({}));

    expect(result).toEqual([[{ ...users[0], roles: ['admin'] }], 1]);
    expect(repository.findAndCount).toHaveBeenCalledWith({ order: { updated_at: 'DESC' } });
    expect(repository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('defaults to the first page when query params are provided without pagination params', async () => {
    queryBuilder.getManyAndCount.mockResolvedValueOnce([users, 1]);

    const result = await handler.execute(new FindUsersQuery({ q: 'ada' }));

    expect(result).toEqual([[{ ...users[0], roles: ['admin'] }], 1]);
    expect(queryBuilder.where).toHaveBeenCalledWith('user.name LIKE :q OR user.email LIKE :q', { q: '%ada%' });
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(20);
  });

  it('accepts take as a legacy alias for limit', async () => {
    queryBuilder.getManyAndCount.mockResolvedValueOnce([users, 1]);

    await handler.execute(new FindUsersQuery({ page: 3, take: 10 }));

    expect(queryBuilder.skip).toHaveBeenCalledWith(20);
    expect(queryBuilder.take).toHaveBeenCalledWith(10);
  });

  it.each([
    { page: 0 },
    { page: 1, limit: 0 },
    { page: 1, limit: -1 },
    { page: 1, limit: 2.5 },
    { page: 1, limit: 'abc' },
    { page: 1, limit: 101 }
  ])('throws BadRequestException when pagination parameters are invalid: %p', async (params) => {
    const promise = handler.execute(new FindUsersQuery(params));

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('Les paramètres de pagination sont invalides');
    expect(repository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when users cannot be found unexpectedly', async () => {
    queryBuilder.getManyAndCount.mockRejectedValueOnce(new Error('database unavailable'));
    const promise = handler.execute(new FindUsersQuery({ page: 1, q: 'ada' }));

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('Utilisateurs introuvables');
  });

  it('throws BadRequestException when users cannot be found without query params', async () => {
    repository.findAndCount.mockRejectedValueOnce(new Error('database unavailable'));
    const promise = handler.execute(new FindUsersQuery({}));

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('Utilisateurs introuvables');
  });
});
