import { BadRequestException, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { mockDependency } from '@/shared/helpers';
import { FindRoleQuery } from '../../queries';
import { Role } from '../../entities/role.entity';
import { UpdateRoleCommand } from '../impl/update-role.command';
import { UpdateRoleHandler } from '../handlers/update-role.handler';

describe('UpdateRoleHandler', () => {
  let repository: jest.Mocked<Pick<Repository<Role>, 'findOne' | 'merge' | 'save'>>;
  let queryBus: jest.Mocked<Pick<QueryBus, 'execute'>>;
  let handler: UpdateRoleHandler;
  let loggerErrorSpy: jest.SpyInstance;

  const role = { id: 'role-id', name: 'admin' } as Role;
  const updatedRole = { id: 'role-id', name: 'manager' } as Role;

  beforeEach(() => {
    repository = {
      findOne: jest.fn(),
      merge: jest.fn(),
      save: jest.fn()
    };
    queryBus = { execute: jest.fn() };
    handler = new UpdateRoleHandler(mockDependency<Repository<Role>>(repository), mockDependency<QueryBus>(queryBus));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('updates a role when the new name is available', async () => {
    queryBus.execute.mockResolvedValueOnce(role);
    repository.findOne.mockResolvedValueOnce(null);
    repository.merge.mockReturnValueOnce(updatedRole);
    repository.save.mockResolvedValueOnce(updatedRole);

    const result = await handler.execute(new UpdateRoleCommand('role-id', { name: 'manager' }));

    expect(result).toBe(updatedRole);
    expect(queryBus.execute).toHaveBeenCalledWith(new FindRoleQuery({ id: 'role-id' }));
    expect(repository.findOne).toHaveBeenCalledWith({ where: { name: 'manager' } });
    expect(repository.merge).toHaveBeenCalledWith(role, { name: 'manager' });
    expect(repository.save).toHaveBeenCalledWith(updatedRole);
  });

  it('updates a role without checking uniqueness when the name is unchanged', async () => {
    queryBus.execute.mockResolvedValueOnce(role);
    repository.merge.mockReturnValueOnce(role);
    repository.save.mockResolvedValueOnce(role);

    const result = await handler.execute(new UpdateRoleCommand('role-id', { name: 'admin' }));

    expect(result).toBe(role);
    expect(repository.findOne).not.toHaveBeenCalled();
    expect(repository.merge).toHaveBeenCalledWith(role, { name: 'admin' });
    expect(repository.save).toHaveBeenCalledWith(role);
  });

  it('throws ConflictException unchanged when the new name already exists', async () => {
    queryBus.execute.mockResolvedValueOnce(role);
    repository.findOne.mockResolvedValueOnce({ id: 'other-role-id', name: 'manager' } as Role);
    const promise = handler.execute(new UpdateRoleCommand('role-id', { name: 'manager' }));

    await expect(promise).rejects.toThrow(ConflictException);
    await expect(promise).rejects.toThrow('Ce rôle existe déjà');
    expect(repository.merge).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('throws NotFoundException unchanged when the role does not exist', async () => {
    queryBus.execute.mockRejectedValueOnce(new NotFoundException('Rôle introuvable'));
    const promise = handler.execute(new UpdateRoleCommand('role-id', { name: 'manager' }));

    await expect(promise).rejects.toThrow(NotFoundException);
    await expect(promise).rejects.toThrow('Rôle introuvable');
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when role update fails unexpectedly', async () => {
    queryBus.execute.mockResolvedValueOnce(role);
    repository.findOne.mockResolvedValueOnce(null);
    repository.merge.mockReturnValueOnce(updatedRole);
    repository.save.mockRejectedValueOnce(new Error('save failed'));
    const promise = handler.execute(new UpdateRoleCommand('role-id', { name: 'manager' }));

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('Mise à jour du rôle impossible');
  });
});
