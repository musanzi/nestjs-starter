import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateUserHandler } from '@/modules/users/commands/handlers/create-user.handler';
import { DeleteUserHandler } from '@/modules/users/commands/handlers/delete-user.handler';
import { ImportUsersCsvHandler } from '@/modules/users/commands/handlers/import-users-csv.handler';
import { UpdateUserHandler } from '@/modules/users/commands/handlers/update-user.handler';
import { UploadUserAvatarHandler } from '@/modules/users/commands/handlers/upload-user-avatar.handler';
import { FindOrCreateUserHandler } from '@/modules/users/commands/handlers/find-or-create-user.handler';
import {
  CreateUserCommand,
  DeleteUserCommand,
  FindOrCreateUserCommand,
  ImportUsersCsvCommand,
  UpdateUserCommand,
  UploadUserAvatarCommand
} from '@/modules/users/commands';
import { ExportUsersCsvHandler } from '@/modules/users/queries/handlers/export-users-csv.handler';
import { FindUserByEmailHandler } from '@/modules/users/queries/handlers/find-user-by-email.handler';
import { FindUsersHandler } from '@/modules/users/queries/handlers/find-users.handler';
import { ExportUsersCsvQuery, FindUserByEmailQuery, FindUserByIdQuery, FindUsersQuery } from '@/modules/users/queries';
import { parseUsersCsv } from '@/modules/users/helpers/user-csv.helper';
import { PassThrough } from 'stream';

jest.mock('@/modules/users/helpers/user-csv.helper', () => ({
  parseUsersCsv: jest.fn()
}));

function createUsersQueryBuilder(result: [any[], number] = [[{ id: 'u1', roles: [{ name: 'user' }] }], 1]) {
  return {
    select: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue(result),
    getMany: jest.fn().mockResolvedValue([{ name: 'Ada', email: 'ada@example.com' }])
  };
}

describe('Users CQRS handlers', () => {
  let userRepository: any;
  let commandBus: any;
  let queryBus: any;

  beforeEach(() => {
    userRepository = {
      create: jest.fn((dto) => dto),
      save: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn((entity, dto) => ({ ...entity, ...dto })),
      createQueryBuilder: jest.fn(),
      softDelete: jest.fn()
    };
    commandBus = {
      execute: jest.fn()
    };
    queryBus = {
      execute: jest.fn()
    };
  });

  describe('commands', () => {
    it('creates users with a default password and role id stubs', async () => {
      userRepository.save.mockResolvedValue({ id: 'u1', roles: [{ id: 'r1' }] });
      queryBus.execute.mockResolvedValue({ id: 'u1', roles: ['staff'] });
      const handler = new CreateUserHandler(userRepository, queryBus);

      await expect(
        handler.execute(new CreateUserCommand({ email: 'ada@example.com', name: 'Ada', roles: ['r1'] }))
      ).resolves.toEqual(expect.objectContaining({ roles: ['staff'] }));
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'user1234',
          roles: [{ id: 'r1' }]
        })
      );
      expect(queryBus.execute).toHaveBeenCalledWith(new FindUserByIdQuery('u1'));
    });

    it('updates users and normalizes roles', async () => {
      queryBus.execute
        .mockResolvedValueOnce({ id: 'u1', roles: ['user'] })
        .mockResolvedValueOnce({ id: 'u1', name: 'Ada', roles: ['admin'] });
      userRepository.save.mockResolvedValue({ id: 'u1' });
      const handler = new UpdateUserHandler(userRepository, queryBus);

      await expect(handler.execute(new UpdateUserCommand('u1', { roles: ['r1'] }))).resolves.toEqual(
        expect.objectContaining({ roles: ['admin'] })
      );
      expect(queryBus.execute).toHaveBeenNthCalledWith(1, new FindUserByIdQuery('u1'));
      expect(userRepository.save).toHaveBeenCalledWith({ id: 'u1', roles: [{ id: 'r1' }] });
      expect(queryBus.execute).toHaveBeenNthCalledWith(2, new FindUserByIdQuery('u1'));
    });

    it('throws not found when updating a missing user', async () => {
      queryBus.execute.mockRejectedValue(new NotFoundException('Utilisateur introuvable'));
      const handler = new UpdateUserHandler(userRepository, queryBus);

      await expect(handler.execute(new UpdateUserCommand('missing', {}))).rejects.toBeInstanceOf(NotFoundException);
    });

    it('soft deletes existing users', async () => {
      queryBus.execute.mockResolvedValue({ id: 'u1' });
      userRepository.softDelete.mockResolvedValue({ affected: 1 });
      const handler = new DeleteUserHandler(userRepository, queryBus);

      await expect(handler.execute(new DeleteUserCommand('u1'))).resolves.toBeUndefined();
      expect(queryBus.execute).toHaveBeenCalledWith(new FindUserByIdQuery('u1'));
      expect(userRepository.softDelete).toHaveBeenCalledWith('u1');
    });

    it('updates existing users when finding or creating by email', async () => {
      queryBus.execute.mockResolvedValue({ id: 'u-existing', email: 'existing@example.com', roles: ['user'] });
      commandBus.execute.mockResolvedValue({ id: 'u-existing', name: 'Existing', roles: ['admin'] });
      const handler = new FindOrCreateUserHandler(commandBus, queryBus);

      await expect(
        handler.execute(new FindOrCreateUserCommand({ email: 'existing@example.com', name: 'Existing' }))
      ).resolves.toEqual(expect.objectContaining({ roles: ['admin'] }));
      expect(queryBus.execute).toHaveBeenCalledWith(new FindUserByEmailQuery('existing@example.com'));
      expect(commandBus.execute).toHaveBeenCalledWith(
        new UpdateUserCommand('u-existing', { email: 'existing@example.com', name: 'Existing' })
      );
    });

    it('creates users when finding or creating by missing email', async () => {
      queryBus.execute.mockRejectedValue(new NotFoundException("Cet utilisateur n'existe pas"));
      commandBus.execute.mockResolvedValue({ id: 'u-new', roles: ['user'] });
      const handler = new FindOrCreateUserHandler(commandBus, queryBus);

      await expect(
        handler.execute(new FindOrCreateUserCommand({ email: 'new@example.com', name: 'New' }))
      ).resolves.toEqual(expect.objectContaining({ id: 'u-new' }));
      expect(commandBus.execute).toHaveBeenCalledWith(new CreateUserCommand({ email: 'new@example.com', name: 'New' }));
    });

    it('imports only missing users from csv', async () => {
      (parseUsersCsv as jest.Mock).mockResolvedValue([
        { email: 'existing@example.com', name: 'Existing' },
        { email: 'new@example.com', name: 'New' }
      ]);
      queryBus.execute
        .mockResolvedValueOnce({ id: 'u-existing' })
        .mockRejectedValueOnce(new NotFoundException("Cet utilisateur n'existe pas"));
      commandBus.execute.mockResolvedValue({ id: 'u-new' });
      const handler = new ImportUsersCsvHandler(commandBus, queryBus);

      await expect(
        handler.execute(new ImportUsersCsvCommand({ buffer: Buffer.from('csv') } as any))
      ).resolves.toBeUndefined();
      expect(queryBus.execute).toHaveBeenNthCalledWith(1, new FindUserByEmailQuery('existing@example.com'));
      expect(queryBus.execute).toHaveBeenNthCalledWith(2, new FindUserByEmailQuery('new@example.com'));
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(new CreateUserCommand({ email: 'new@example.com', name: 'New' }));
    });

    it('uploads avatars to the avatar field', async () => {
      queryBus.execute
        .mockResolvedValueOnce({ id: 'u1', avatar: null, roles: ['user'] })
        .mockResolvedValueOnce({ id: 'u1', avatar: 'avatar.png', roles: ['user'] });
      userRepository.save.mockResolvedValue({ id: 'u1', avatar: 'avatar.png' });
      const handler = new UploadUserAvatarHandler(userRepository, queryBus);

      await expect(
        handler.execute(
          new UploadUserAvatarCommand({ id: 'u1', avatar: null } as any, { filename: 'avatar.png' } as any)
        )
      ).resolves.toEqual(expect.objectContaining({ avatar: 'avatar.png', roles: ['user'] }));
      expect(queryBus.execute).toHaveBeenNthCalledWith(1, new FindUserByIdQuery('u1'));
      expect(userRepository.save).toHaveBeenCalledWith({ id: 'u1', avatar: 'avatar.png' });
      expect(queryBus.execute).toHaveBeenNthCalledWith(2, new FindUserByIdQuery('u1'));
    });
  });

  describe('queries', () => {
    it('finds paginated users with search and normalized roles', async () => {
      const qb = createUsersQueryBuilder([[{ id: 'u1', roles: [{ name: 'user' }] }], 1]);
      userRepository.createQueryBuilder.mockReturnValue(qb);
      const handler = new FindUsersHandler(userRepository);

      await expect(handler.execute(new FindUsersQuery({ page: 2, q: 'ada' }))).resolves.toEqual([
        [{ id: 'u1', roles: ['user'] }],
        1
      ]);
      expect(qb.where).toHaveBeenCalledWith('user.name LIKE :q OR user.email LIKE :q', { q: '%ada%' });
      expect(qb.skip).toHaveBeenCalledWith(50);
      expect(qb.take).toHaveBeenCalledWith(50);
    });

    it('rejects invalid user pagination', async () => {
      const handler = new FindUsersHandler(userRepository);

      await expect(handler.execute(new FindUsersQuery({ page: 0 }))).rejects.toThrow(
        'Les paramètres de pagination sont invalides'
      );
    });

    it('finds a user by email with normalized roles', async () => {
      userRepository.findOne.mockResolvedValue({ id: 'u1', email: 'ada@example.com', roles: [{ name: 'user' }] });
      const handler = new FindUserByEmailHandler(userRepository);

      await expect(handler.execute(new FindUserByEmailQuery('ada@example.com'))).resolves.toEqual(
        expect.objectContaining({ roles: ['user'] })
      );
    });

    it('throws not found for a missing email', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const handler = new FindUserByEmailHandler(userRepository);

      await expect(handler.execute(new FindUserByEmailQuery('missing@example.com'))).rejects.toBeInstanceOf(
        NotFoundException
      );
    });

    it('exports csv with user entity fields only', async () => {
      const qb = createUsersQueryBuilder();
      userRepository.createQueryBuilder.mockReturnValue(qb);
      const output = new PassThrough();
      const chunks: Buffer[] = [];
      output.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      const handler = new ExportUsersCsvHandler(userRepository);

      await handler.execute(new ExportUsersCsvQuery({}, output as any));
      await new Promise((resolve) => setImmediate(resolve));

      expect(qb.select).toHaveBeenCalledWith(['user.name', 'user.email']);
      expect(Buffer.concat(chunks).toString()).toContain('Name,Email');
      expect(Buffer.concat(chunks).toString()).toContain('Ada,ada@example.com');
    });

    it('maps export failures to bad requests', async () => {
      const qb = createUsersQueryBuilder();
      qb.getMany.mockRejectedValue(new Error('database unavailable'));
      userRepository.createQueryBuilder.mockReturnValue(qb);
      const handler = new ExportUsersCsvHandler(userRepository);

      await expect(handler.execute(new ExportUsersCsvQuery({}, new PassThrough() as any))).rejects.toBeInstanceOf(
        BadRequestException
      );
    });
  });
});
