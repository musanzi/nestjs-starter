import { Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
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

  it('returns a role using TypeORM find one options', async () => {
    const options = { where: { id: 'role-id' } };
    repository.findOneOrFail.mockResolvedValueOnce(role);

    const result = await handler.execute(new FindRoleQuery(options));

    expect(result).toBe(role);
    expect(repository.findOneOrFail).toHaveBeenCalledWith(options);
  });

  it('supports looking up a role by name', async () => {
    const options = { where: { name: 'admin' } };
    repository.findOneOrFail.mockResolvedValueOnce(role);

    const result = await handler.execute(new FindRoleQuery(options));

    expect(result).toBe(role);
    expect(repository.findOneOrFail).toHaveBeenCalledWith(options);
  });

  it('throws NotFoundException when the role cannot be found', async () => {
    repository.findOneOrFail.mockRejectedValueOnce(new Error('not found'));
    const promise = handler.execute(new FindRoleQuery({ where: { id: 'role-id' } }));

    await expect(promise).rejects.toThrow(NotFoundException);
    await expect(promise).rejects.toThrow('Rôle introuvable');
  });
});
