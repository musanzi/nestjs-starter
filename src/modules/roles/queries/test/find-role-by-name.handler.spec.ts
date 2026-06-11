import { Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { mockDependency } from '@/shared/helpers';
import { Role } from '../../entities/role.entity';
import { FindRoleByNameQuery } from '../impl/find-role-by-name.query';
import { FindRoleByNameHandler } from '../handlers/find-role-by-name.handler';

describe('FindRoleByNameHandler', () => {
  let repository: jest.Mocked<Pick<Repository<Role>, 'findOneOrFail'>>;
  let handler: FindRoleByNameHandler;
  let loggerErrorSpy: jest.SpyInstance;

  const role = { id: 'role-id', name: 'admin' } as Role;

  beforeEach(() => {
    repository = { findOneOrFail: jest.fn() };
    handler = new FindRoleByNameHandler(mockDependency<Repository<Role>>(repository));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('returns a role by name', async () => {
    repository.findOneOrFail.mockResolvedValueOnce(role);

    const result = await handler.execute(new FindRoleByNameQuery('admin'));

    expect(result).toBe(role);
    expect(repository.findOneOrFail).toHaveBeenCalledWith({ where: { name: 'admin' } });
  });

  it('throws NotFoundException when the role cannot be found', async () => {
    repository.findOneOrFail.mockRejectedValueOnce(new Error('not found'));
    const promise = handler.execute(new FindRoleByNameQuery('admin'));

    await expect(promise).rejects.toThrow(NotFoundException);
    await expect(promise).rejects.toThrow('Rôle introuvable');
  });
});
