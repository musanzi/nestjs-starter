import { Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { mockDependency } from '@/shared/helpers';
import { Role } from '../../entities/role.entity';
import { FindRoleQuery } from '../impl/find-role.query';
import { FindRoleHandler } from '../handlers/find-role.handler';

describe('FindRoleHandler', () => {
  let repository: jest.Mocked<Pick<Repository<Role>, 'findOneByOrFail'>>;
  let handler: FindRoleHandler;
  let loggerErrorSpy: jest.SpyInstance;

  const role = { id: 'role-id', name: 'admin' } as Role;

  beforeEach(() => {
    repository = { findOneByOrFail: jest.fn() };
    handler = new FindRoleHandler(mockDependency<Repository<Role>>(repository));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('returns a role using role lookup conditions', async () => {
    const where = { id: 'role-id' };
    repository.findOneByOrFail.mockResolvedValueOnce(role);

    const result = await handler.execute(new FindRoleQuery(where));

    expect(result).toBe(role);
    expect(repository.findOneByOrFail).toHaveBeenCalledWith(where);
  });

  it('supports looking up a role by name', async () => {
    const where = { name: 'admin' };
    repository.findOneByOrFail.mockResolvedValueOnce(role);

    const result = await handler.execute(new FindRoleQuery(where));

    expect(result).toBe(role);
    expect(repository.findOneByOrFail).toHaveBeenCalledWith(where);
  });

  it('throws NotFoundException when the role cannot be found', async () => {
    repository.findOneByOrFail.mockRejectedValueOnce(new Error('not found'));
    const promise = handler.execute(new FindRoleQuery({ id: 'role-id' }));

    await expect(promise).rejects.toThrow(NotFoundException);
    await expect(promise).rejects.toThrow('Rôle introuvable');
  });
});
