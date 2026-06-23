import { BadRequestException, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { mockDependency } from '@/shared/helpers';
import { Role } from '@/modules/roles/entities/role.entity';
import { User } from '@/modules/users/entities/user.entity';
import { FindStatsHandler } from '../handlers/find-stats.handler';
import { FindStatsQuery } from '../impl';

describe('FindStatsHandler', () => {
  let dataSource: jest.Mocked<Pick<DataSource, 'getRepository'>>;
  let usersRepository: jest.Mocked<Pick<Repository<User>, 'count'>>;
  let rolesRepository: jest.Mocked<Pick<Repository<Role>, 'count'>>;
  let handler: FindStatsHandler;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    usersRepository = { count: jest.fn() };
    rolesRepository = { count: jest.fn() };
    dataSource = {
      getRepository: jest.fn((entity) => {
        if (entity === User) return mockDependency<Repository<User>>(usersRepository);
        return mockDependency<Repository<Role>>(rolesRepository);
      })
    };
    handler = new FindStatsHandler(mockDependency<DataSource>(dataSource));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('returns users and roles totals', async () => {
    usersRepository.count.mockResolvedValueOnce(2);
    rolesRepository.count.mockResolvedValueOnce(2);

    const result = await handler.execute(new FindStatsQuery());

    expect(result).toEqual([
      { label: 'Utilisateurs', total: 2 },
      { label: 'Rôles', total: 2 }
    ]);
    expect(dataSource.getRepository).toHaveBeenCalledWith(User);
    expect(dataSource.getRepository).toHaveBeenCalledWith(Role);
    expect(usersRepository.count).toHaveBeenCalledTimes(1);
    expect(rolesRepository.count).toHaveBeenCalledTimes(1);
  });

  it('throws BadRequestException when stats cannot be counted', async () => {
    usersRepository.count.mockRejectedValueOnce(new Error('database unavailable'));
    rolesRepository.count.mockResolvedValueOnce(2);

    const promise = handler.execute(new FindStatsQuery());

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('Statistiques introuvables');
  });
});
