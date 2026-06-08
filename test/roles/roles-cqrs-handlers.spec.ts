import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateRoleHandler } from '@/modules/identity/roles/commands/handlers/create-role.handler';
import { DeleteRoleHandler } from '@/modules/identity/roles/commands/handlers/delete-role.handler';
import { UpdateRoleHandler } from '@/modules/identity/roles/commands/handlers/update-role.handler';
import { CreateRoleCommand, DeleteRoleCommand, UpdateRoleCommand } from '@/modules/identity/roles/commands';
import { FindAllRolesHandler } from '@/modules/identity/roles/queries/handlers/find-all-roles.handler';
import { FindPaginatedRolesHandler } from '@/modules/identity/roles/queries/handlers/find-paginated-roles.handler';
import { FindRoleByIdHandler } from '@/modules/identity/roles/queries/handlers/find-role-by-id.handler';
import { FindRoleByNameHandler } from '@/modules/identity/roles/queries/handlers/find-role-by-name.handler';
import {
  FindAllRolesQuery,
  FindPaginatedRolesQuery,
  FindRoleByIdQuery,
  FindRoleByNameQuery
} from '@/modules/identity/roles/queries';

function createQueryBuilder(result: [any[], number]) {
  return {
    orderBy: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue(result)
  };
}

describe('Roles CQRS handlers', () => {
  let repository: any;

  beforeEach(() => {
    repository = {
      create: jest.fn((dto) => dto),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn((entity, dto) => ({ ...entity, ...dto })),
      createQueryBuilder: jest.fn(),
      delete: jest.fn()
    };
  });

  describe('CreateRoleHandler', () => {
    it('creates role when name is available', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.save.mockResolvedValue({ id: 'r1', name: 'staff' });
      const handler = new CreateRoleHandler(repository);

      await expect(handler.execute(new CreateRoleCommand({ name: 'staff' }))).resolves.toEqual({
        id: 'r1',
        name: 'staff'
      });
      expect(repository.create).toHaveBeenCalledWith({ name: 'staff' });
    });

    it('throws conflict when role name exists', async () => {
      repository.findOne.mockResolvedValue({ id: 'r1', name: 'staff' });
      const handler = new CreateRoleHandler(repository);

      await expect(handler.execute(new CreateRoleCommand({ name: 'staff' }))).rejects.toBeInstanceOf(ConflictException);
    });

    it('maps unexpected persistence errors', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.save.mockRejectedValue(new Error('database unavailable'));
      const handler = new CreateRoleHandler(repository);

      await expect(handler.execute(new CreateRoleCommand({ name: 'staff' }))).rejects.toBeInstanceOf(
        BadRequestException
      );
    });
  });

  describe('UpdateRoleHandler', () => {
    it('updates role with fetch merge save flow', async () => {
      repository.findOne.mockResolvedValueOnce({ id: 'r1', name: 'user' }).mockResolvedValueOnce(null);
      repository.save.mockResolvedValue({ id: 'r1', name: 'mentor' });
      const handler = new UpdateRoleHandler(repository);

      await expect(handler.execute(new UpdateRoleCommand('r1', { name: 'mentor' }))).resolves.toEqual({
        id: 'r1',
        name: 'mentor'
      });
      expect(repository.merge).toHaveBeenCalledWith({ id: 'r1', name: 'user' }, { name: 'mentor' });
    });

    it('throws not found when role is missing', async () => {
      repository.findOne.mockResolvedValue(null);
      const handler = new UpdateRoleHandler(repository);

      await expect(handler.execute(new UpdateRoleCommand('missing', { name: 'mentor' }))).rejects.toBeInstanceOf(
        NotFoundException
      );
    });

    it('throws conflict when another role has the requested name', async () => {
      repository.findOne.mockResolvedValueOnce({ id: 'r1', name: 'user' }).mockResolvedValueOnce({
        id: 'r2',
        name: 'mentor'
      });
      const handler = new UpdateRoleHandler(repository);

      await expect(handler.execute(new UpdateRoleCommand('r1', { name: 'mentor' }))).rejects.toBeInstanceOf(
        ConflictException
      );
    });
  });

  describe('DeleteRoleHandler', () => {
    it('hard deletes existing role', async () => {
      repository.findOne.mockResolvedValue({ id: 'r1', name: 'staff' });
      repository.delete.mockResolvedValue({ affected: 1 });
      const handler = new DeleteRoleHandler(repository);

      await expect(handler.execute(new DeleteRoleCommand('r1'))).resolves.toBeUndefined();
      expect(repository.delete).toHaveBeenCalledWith('r1');
    });

    it('throws not found before deleting missing role', async () => {
      repository.findOne.mockResolvedValue(null);
      const handler = new DeleteRoleHandler(repository);

      await expect(handler.execute(new DeleteRoleCommand('missing'))).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });

  describe('query handlers', () => {
    it('finds all roles ordered by update date', async () => {
      repository.find.mockResolvedValue([{ id: 'r1' }]);
      const handler = new FindAllRolesHandler(repository);

      await expect(handler.execute(new FindAllRolesQuery())).resolves.toEqual([{ id: 'r1' }]);
      expect(repository.find).toHaveBeenCalledWith({ order: { updated_at: 'DESC' } });
    });

    it('finds paginated roles with search and page window', async () => {
      const qb = createQueryBuilder([[{ id: 'r1' }], 1]);
      repository.createQueryBuilder.mockReturnValue(qb);
      const handler = new FindPaginatedRolesHandler(repository);

      await expect(handler.execute(new FindPaginatedRolesQuery({ page: 2, q: 'st' }))).resolves.toEqual([
        [{ id: 'r1' }],
        1
      ]);
      expect(qb.where).toHaveBeenCalledWith('role.name LIKE :name', { name: '%st%' });
      expect(qb.skip).toHaveBeenCalledWith(40);
      expect(qb.take).toHaveBeenCalledWith(40);
    });

    it('rejects invalid role pagination', async () => {
      const handler = new FindPaginatedRolesHandler(repository);

      await expect(handler.execute(new FindPaginatedRolesQuery({ page: 0 }))).rejects.toThrow(
        'Les paramètres de pagination sont invalides'
      );
    });

    it('finds role by id', async () => {
      repository.findOne.mockResolvedValue({ id: 'r1', name: 'staff' });
      const handler = new FindRoleByIdHandler(repository);

      await expect(handler.execute(new FindRoleByIdQuery('r1'))).resolves.toEqual({ id: 'r1', name: 'staff' });
    });

    it('throws not found for missing role id', async () => {
      repository.findOne.mockResolvedValue(null);
      const handler = new FindRoleByIdHandler(repository);

      await expect(handler.execute(new FindRoleByIdQuery('missing'))).rejects.toBeInstanceOf(NotFoundException);
    });

    it('finds role by name', async () => {
      repository.findOne.mockResolvedValue({ id: 'r1', name: 'user' });
      const handler = new FindRoleByNameHandler(repository);

      await expect(handler.execute(new FindRoleByNameQuery('user'))).resolves.toEqual({ id: 'r1', name: 'user' });
    });

    it('throws not found for missing role name', async () => {
      repository.findOne.mockResolvedValue(null);
      const handler = new FindRoleByNameHandler(repository);

      await expect(handler.execute(new FindRoleByNameQuery('missing'))).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
