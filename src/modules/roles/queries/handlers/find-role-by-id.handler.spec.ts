import { Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { mockDependency } from '../../../../../test/mock-dependency';
import { Role } from '../../entities/role.entity';
import { FindRoleByIdQuery } from '../impl/find-role-by-id.query';
import { FindRoleByIdHandler } from './find-role-by-id.handler';

describe('FindRoleByIdHandler', () => {
  let repository: jest.Mocked<Pick<Repository<Role>, 'findOneOrFail'>>;
  let handler: FindRoleByIdHandler;
  let loggerErrorSpy: jest.SpyInstance;

  const role = { id: 'role-id', name: 'admin' } as Role;

  beforeEach(() => {
    repository = { findOneOrFail: jest.fn() };
    handler = new FindRoleByIdHandler(mockDependency<Repository<Role>>(repository));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('returns a role by id', async () => {
    repository.findOneOrFail.mockResolvedValueOnce(role);

    const result = await handler.execute(new FindRoleByIdQuery('role-id'));

    expect(result).toBe(role);
    expect(repository.findOneOrFail).toHaveBeenCalledWith({ where: { id: 'role-id' } });
  });

  it('throws NotFoundException when the role cannot be found', async () => {
    repository.findOneOrFail.mockRejectedValueOnce(new Error('not found'));
    const promise = handler.execute(new FindRoleByIdQuery('role-id'));

    await expect(promise).rejects.toThrow(NotFoundException);
    await expect(promise).rejects.toThrow('Rôle introuvable');
  });
});
