import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from '@/modules/identity/users/services/users.service';
import { parseUsersCsv } from '@/modules/identity/users/helpers/user-csv.helper';

jest.mock('@/modules/identity/users/helpers/user-csv.helper', () => ({
  parseUsersCsv: jest.fn()
}));

const makeUsersQueryBuilder = () => ({
  addSelect: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  loadRelationCountAndMap: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getOneOrFail: jest.fn().mockResolvedValue({ id: 'u1', roles: [{ name: 'user' }] }),
  getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'u1' }], 1]),
  getMany: jest.fn().mockResolvedValue([{ id: 'u1' }])
});

describe('UsersService', () => {
  const setup = () => {
    const queryBuilder = makeUsersQueryBuilder();
    const userRepository = {
      create: jest.fn((dto) => dto),
      find: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      merge: jest.fn((entity, dto) => ({ ...entity, ...dto })),
      count: jest.fn(),
      softDelete: jest.fn(),
      delete: jest.fn()
    } as any;
    const queryBus = { execute: jest.fn() } as any;
    const eventEmitter = { emit: jest.fn() } as any;
    const service = new UsersService(userRepository, queryBus);
    return { service, userRepository, queryBus, eventEmitter, queryBuilder };
  };

  it('creates user with defaults', async () => {
    const { service, userRepository } = setup();
    userRepository.save.mockResolvedValue({ id: 'u1' });
    await expect(service.create({ email: 'a@a.com', roles: ['r1'] } as any)).resolves.toEqual({ id: 'u1' });
    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        password: 'user1234',
        roles: [{ id: 'r1' }]
      })
    );
  });

  it('finds all users with pagination and search', async () => {
    const { service, queryBuilder } = setup();
    await expect(service.findAll({ page: 2, q: 'john' } as any)).resolves.toEqual([[{ id: 'u1' }], 1]);
    expect(queryBuilder.where).toHaveBeenCalledWith('u.name LIKE :q OR u.email LIKE :q', { q: '%john%' });
    expect(queryBuilder.skip).toHaveBeenCalledWith(50);
  });

  it('finds one user and maps roles', async () => {
    const { service, userRepository } = setup();
    userRepository.findOneOrFail.mockResolvedValue({ id: 'u1', roles: [{ name: 'user' }] });
    await expect(service.findOne('u1')).resolves.toEqual(expect.objectContaining({ roles: ['user'] }));
  });

  it('throws on findOne failure', async () => {
    const { service, userRepository } = setup();
    userRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.findOne('u1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds user by email and maps roles', async () => {
    const { service, userRepository } = setup();
    userRepository.findOneOrFail.mockResolvedValue({ id: 'u1', roles: [{ name: 'user' }] });
    await expect(service.findByEmail('a@a.com')).resolves.toEqual(expect.objectContaining({ roles: ['user'] }));
  });

  it('throws not found for missing email', async () => {
    const { service, userRepository } = setup();
    userRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.findByEmail('x@x.com')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('finds one by email', async () => {
    const { service, userRepository } = setup();
    userRepository.findOneOrFail.mockResolvedValue({ id: 'u1' });
    await expect(service.findOneByEmail('a@a.com')).resolves.toEqual({ id: 'u1' });
  });

  it('throws not found for findOneByEmail failure', async () => {
    const { service, userRepository } = setup();
    userRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.findOneByEmail('a@a.com')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('finds or updates existing user', async () => {
    const { service, userRepository } = setup();
    userRepository.findOneOrFail.mockResolvedValue({ id: 'u1', avatar: null });
    jest.spyOn(service, 'update').mockResolvedValue({ id: 'u1', name: 'new' } as any);
    await expect(service.findOrCreate({ email: 'a@a.com', name: 'new' } as any)).resolves.toEqual({
      id: 'u1',
      name: 'new'
    });
  });

  it('creates user when not existing', async () => {
    const { service, userRepository, queryBus } = setup();
    userRepository.findOne.mockResolvedValue(null);
    queryBus.execute.mockResolvedValue({ id: 'role-user' });
    userRepository.save.mockResolvedValue({ id: 'u-new' });
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'u-new' } as any);
    await expect(service.findOrCreate({ email: 'n@n.com' } as any)).resolves.toEqual({ id: 'u-new' });
  });

  it('throws on findOrCreate failure', async () => {
    const { service, userRepository } = setup();
    userRepository.findOne.mockRejectedValue(new Error('bad'));
    await expect(service.findOrCreate({ email: 'a@a.com' } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('imports users from csv', async () => {
    const { service } = setup();
    (parseUsersCsv as jest.Mock).mockResolvedValue([{ email: 'a@a.com' }, { email: 'b@b.com' }]);
    const findOrCreateSpy = jest.spyOn(service, 'findOrCreate').mockResolvedValue({ id: 'u1' } as any);
    await expect(service.importCsv({ buffer: Buffer.from('x') } as any)).resolves.toBeUndefined();
    expect(findOrCreateSpy).toHaveBeenCalledTimes(2);
  });

  it('throws on importCsv failure', async () => {
    const { service } = setup();
    (parseUsersCsv as jest.Mock).mockRejectedValue(new Error('bad'));
    await expect(service.importCsv({ buffer: Buffer.from('x') } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates user and remaps roles', async () => {
    const { service, userRepository } = setup();
    userRepository.findOneOrFail.mockResolvedValue({ id: 'u1', roles: [{ id: 'r-old' }] });
    userRepository.save.mockResolvedValue({ id: 'u1' });
    await expect(service.update('u1', { roles: ['r1'] } as any)).resolves.toEqual({ id: 'u1' });
    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'u1',
        roles: [{ id: 'r1' }]
      })
    );
  });

  it('throws on update failure', async () => {
    const { service, userRepository } = setup();
    userRepository.findOneOrFail.mockRejectedValue(new Error('bad'));
    await expect(service.update('u1', {} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('soft deletes user', async () => {
    const { service, userRepository } = setup();
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'u1' } as any);
    userRepository.softDelete.mockResolvedValue(undefined);
    await expect(service.remove('u1')).resolves.toBeUndefined();
  });

  it('throws on remove failure', async () => {
    const { service, userRepository } = setup();
    userRepository.softDelete.mockRejectedValue(new Error('bad'));
    await expect(service.remove('u1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
