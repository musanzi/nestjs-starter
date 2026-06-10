import { BadRequestException, Logger } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { mockDependency } from '@/shared/helpers';
import { Role } from '../../entities/role.entity';
import { FindRolesQuery } from '../impl/find-roles.query';
import { FindRolesHandler } from '../handlers/find-roles.handler';

describe('FindRolesHandler', () => {
  let repository: jest.Mocked<Pick<Repository<Role>, 'createQueryBuilder' | 'findAndCount'>>;
  let queryBuilder: jest.Mocked<
    Pick<SelectQueryBuilder<Role>, 'orderBy' | 'where' | 'skip' | 'take' | 'getManyAndCount'>
  >;
  let handler: FindRolesHandler;
  let loggerErrorSpy: jest.SpyInstance;

  const roles = [{ id: 'role-id', name: 'admin' }] as Role[];

  beforeEach(() => {
    queryBuilder = {
      orderBy: jest.fn(),
      where: jest.fn(),
      skip: jest.fn(),
      take: jest.fn(),
      getManyAndCount: jest.fn()
    };
    queryBuilder.orderBy.mockReturnValue(mockDependency<SelectQueryBuilder<Role>>(queryBuilder));
    queryBuilder.where.mockReturnValue(mockDependency<SelectQueryBuilder<Role>>(queryBuilder));
    queryBuilder.skip.mockReturnValue(mockDependency<SelectQueryBuilder<Role>>(queryBuilder));
    queryBuilder.take.mockReturnValue(mockDependency<SelectQueryBuilder<Role>>(queryBuilder));
    repository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findAndCount: jest.fn()
    };
    handler = new FindRolesHandler(mockDependency<Repository<Role>>(repository));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('returns all roles without pagination when no query params are provided', async () => {
    repository.findAndCount.mockResolvedValueOnce([roles, 1]);

    const result = await handler.execute(new FindRolesQuery({}));

    expect(result).toEqual([roles, 1]);
    expect(repository.findAndCount).toHaveBeenCalledWith({ order: { updatedAt: 'DESC' } });
    expect(repository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('returns filtered roles using the requested page, limit, and search query', async () => {
    queryBuilder.getManyAndCount.mockResolvedValueOnce([roles, 1]);

    const result = await handler.execute(new FindRolesQuery({ page: 2, limit: 25, q: 'adm' }));

    expect(result).toEqual([roles, 1]);
    expect(repository.createQueryBuilder).toHaveBeenCalledWith('role');
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('role.updatedAt', 'DESC');
    expect(queryBuilder.where).toHaveBeenCalledWith('role.name LIKE :name', { name: '%adm%' });
    expect(queryBuilder.skip).toHaveBeenCalledWith(25);
    expect(queryBuilder.take).toHaveBeenCalledWith(25);
    expect(queryBuilder.getManyAndCount).toHaveBeenCalledTimes(1);
  });

  it('defaults to the first page when query params are provided without pagination params', async () => {
    queryBuilder.getManyAndCount.mockResolvedValueOnce([roles, 1]);

    const result = await handler.execute(new FindRolesQuery({ q: 'adm' }));

    expect(result).toEqual([roles, 1]);
    expect(queryBuilder.where).toHaveBeenCalledWith('role.name LIKE :name', { name: '%adm%' });
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(20);
  });

  it('accepts take as a legacy alias for limit', async () => {
    queryBuilder.getManyAndCount.mockResolvedValueOnce([roles, 1]);

    await handler.execute(new FindRolesQuery({ page: 3, take: 10 }));

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
    const promise = handler.execute(new FindRolesQuery(params));

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('Les paramètres de pagination sont invalides');
    expect(repository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when roles cannot be found without query params', async () => {
    repository.findAndCount.mockRejectedValueOnce(new Error('database unavailable'));
    const promise = handler.execute(new FindRolesQuery({}));

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('Rôles introuvables');
  });

  it('throws BadRequestException when filtered roles cannot be found', async () => {
    queryBuilder.getManyAndCount.mockRejectedValueOnce(new Error('database unavailable'));
    const promise = handler.execute(new FindRolesQuery({ page: 1, q: 'adm' }));

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('Rôles introuvables');
  });
});
