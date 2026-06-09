import { Logger, NotFoundException } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { mockDependency } from '@/shared/helpers';
import { User } from '../../entities/user.entity';
import { FindUserByEmailWithPasswordQuery } from '../impl/find-user-by-email-with-password.query';
import { FindUserByEmailWithPasswordHandler } from '../handlers/find-user-by-email-with-password.handler';

describe('FindUserByEmailWithPasswordHandler', () => {
  let repository: jest.Mocked<Pick<Repository<User>, 'createQueryBuilder'>>;
  let queryBuilder: jest.Mocked<
    Pick<SelectQueryBuilder<User>, 'addSelect' | 'leftJoinAndSelect' | 'where' | 'getOneOrFail'>
  >;
  let handler: FindUserByEmailWithPasswordHandler;
  let loggerErrorSpy: jest.SpyInstance;

  const user = { id: 'user-id', email: 'ada@example.com', password: 'hashed-password' } as User;

  beforeEach(() => {
    queryBuilder = {
      addSelect: jest.fn(),
      leftJoinAndSelect: jest.fn(),
      where: jest.fn(),
      getOneOrFail: jest.fn()
    };
    queryBuilder.addSelect.mockReturnValue(mockDependency<SelectQueryBuilder<User>>(queryBuilder));
    queryBuilder.leftJoinAndSelect.mockReturnValue(mockDependency<SelectQueryBuilder<User>>(queryBuilder));
    queryBuilder.where.mockReturnValue(mockDependency<SelectQueryBuilder<User>>(queryBuilder));
    repository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder)
    };
    handler = new FindUserByEmailWithPasswordHandler(mockDependency<Repository<User>>(repository));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('returns a user by email including password and roles', async () => {
    queryBuilder.getOneOrFail.mockResolvedValueOnce(user);

    const result = await handler.execute(new FindUserByEmailWithPasswordQuery('ada@example.com'));

    expect(result).toBe(user);
    expect(repository.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(queryBuilder.addSelect).toHaveBeenCalledWith('user.password');
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('user.roles', 'roles');
    expect(queryBuilder.where).toHaveBeenCalledWith('user.email = :email', { email: 'ada@example.com' });
  });

  it('throws NotFoundException when the user cannot be found', async () => {
    queryBuilder.getOneOrFail.mockRejectedValueOnce(new Error('not found'));
    const promise = handler.execute(new FindUserByEmailWithPasswordQuery('ada@example.com'));

    await expect(promise).rejects.toThrow(NotFoundException);
    await expect(promise).rejects.toThrow("Cet utilisateur n'existe pas");
  });
});
