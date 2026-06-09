import { BadRequestException, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { mockDependency } from '../../../../../test/mock-dependency';
import { Role } from '../../entities/role.entity';
import { FindAllRolesHandler } from '../handlers/find-all-roles.handler';

describe('FindAllRolesHandler', () => {
  let repository: jest.Mocked<Pick<Repository<Role>, 'find'>>;
  let handler: FindAllRolesHandler;
  let loggerErrorSpy: jest.SpyInstance;

  const roles = [{ id: 'role-id', name: 'admin' }] as Role[];

  beforeEach(() => {
    repository = { find: jest.fn() };
    handler = new FindAllRolesHandler(mockDependency<Repository<Role>>(repository));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('returns all roles ordered by most recently updated', async () => {
    repository.find.mockResolvedValueOnce(roles);

    const result = await handler.execute();

    expect(result).toBe(roles);
    expect(repository.find).toHaveBeenCalledWith({ order: { updated_at: 'DESC' } });
  });

  it('throws BadRequestException when roles cannot be found', async () => {
    repository.find.mockRejectedValueOnce(new Error('database unavailable'));
    const promise = handler.execute();

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('Rôles introuvables');
  });
});
