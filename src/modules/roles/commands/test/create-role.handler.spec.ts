import { BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { mockDependency } from '@/shared/helpers';
import { Role } from '../../entities/role.entity';
import { CreateRoleCommand } from '../impl/create-role.command';
import { CreateRoleHandler } from '../handlers/create-role.handler';

describe('CreateRoleHandler', () => {
  let repository: jest.Mocked<Pick<Repository<Role>, 'findOne' | 'create' | 'save'>>;
  let handler: CreateRoleHandler;
  let loggerErrorSpy: jest.SpyInstance;

  const dto = { name: 'admin' };
  const role = { id: 'role-id', name: 'admin' } as Role;

  beforeEach(() => {
    repository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn()
    };
    handler = new CreateRoleHandler(mockDependency<Repository<Role>>(repository));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('creates a role when the name is available', async () => {
    repository.findOne.mockResolvedValueOnce(null);
    repository.create.mockReturnValueOnce(role);
    repository.save.mockResolvedValueOnce(role);

    const result = await handler.execute(new CreateRoleCommand(dto));

    expect(result).toBe(role);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { name: 'admin' } });
    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(repository.save).toHaveBeenCalledWith(role);
  });

  it('throws ConflictException unchanged when the role already exists', async () => {
    repository.findOne.mockResolvedValueOnce(role);
    const promise = handler.execute(new CreateRoleCommand(dto));

    await expect(promise).rejects.toThrow(ConflictException);
    await expect(promise).rejects.toThrow('Ce rôle existe déjà');
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when role creation fails unexpectedly', async () => {
    repository.findOne.mockRejectedValueOnce(new Error('database unavailable'));
    const promise = handler.execute(new CreateRoleCommand(dto));

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('Création du rôle impossible');
  });
});
