import { Logger, NotFoundException } from '@nestjs/common';
import { FindOneOptions, Repository } from 'typeorm';
import { mockDependency } from '@/shared/helpers';
import { Role } from '../../entities/role.entity';
import { FindRoleQuery } from '../impl/find-role.query';
import { FindRoleHandler } from '../handlers/find-role.handler';

describe('FindRoleHandler', () => {
  let repository: jest.Mocked<Pick<Repository<Role>, 'findOneOrFail'>>;
  let handler: FindRoleHandler;
  let loggerErrorSpy: jest.SpyInstance;

  const role = { id: 'role-id', name: 'admin' } as Role;

  beforeEach(() => {
    repository = { findOneOrFail: jest.fn() };
    handler = new FindRoleHandler(mockDependency<Repository<Role>>(repository));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('returns a role using role lookup conditions', async () => {
    const where = { id: 'role-id' };
    repository.findOneOrFail.mockResolvedValueOnce(role);

    const result = await handler.execute(new FindRoleQuery(where));

    expect(result).toBe(role);
    expect(repository.findOneOrFail).toHaveBeenCalledWith({ where });
  });

  it('supports looking up a role by name', async () => {
    const where = { name: 'admin' };
    repository.findOneOrFail.mockResolvedValueOnce(role);

    const result = await handler.execute(new FindRoleQuery(where));

    expect(result).toBe(role);
    expect(repository.findOneOrFail).toHaveBeenCalledWith({ where });
  });

  it('preserves find options while applying role lookup conditions', async () => {
    const options: Omit<FindOneOptions<Role>, 'where'> = { relations: ['users'] };
    repository.findOneOrFail.mockResolvedValueOnce(role);

    const result = await handler.execute(new FindRoleQuery({ id: 'role-id' }, options));

    expect(result).toBe(role);
    expect(repository.findOneOrFail).toHaveBeenCalledWith({
      ...options,
      where: { id: 'role-id' }
    });
  });

  it('throws NotFoundException when the role cannot be found', async () => {
    repository.findOneOrFail.mockRejectedValueOnce(new Error('not found'));
    const promise = handler.execute(new FindRoleQuery({ id: 'role-id' }));

    await expect(promise).rejects.toThrow(NotFoundException);
    await expect(promise).rejects.toThrow('Rôle introuvable');
  });
});
