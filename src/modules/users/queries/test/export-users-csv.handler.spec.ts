import { BadRequestException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { format } from 'fast-csv';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { mockDependency } from '@/shared/helpers';
import { User } from '../../entities/user.entity';
import { ExportUsersCsvQuery } from '../impl';
import { ExportUsersCsvHandler } from '../handlers/export-users-csv.handler';

jest.mock('fast-csv', () => ({
  format: jest.fn()
}));

describe('ExportUsersCsvHandler', () => {
  let repository: jest.Mocked<Pick<Repository<User>, 'createQueryBuilder'>>;
  let queryBuilder: jest.Mocked<Pick<SelectQueryBuilder<User>, 'select' | 'orderBy' | 'where' | 'getMany'>>;
  let handler: ExportUsersCsvHandler;
  let loggerErrorSpy: jest.SpyInstance;
  let csvStream: {
    pipe: jest.Mock;
    write: jest.Mock;
    end: jest.Mock;
  };
  const formatMock = format as jest.MockedFunction<typeof format>;
  const response = { write: jest.fn() } as unknown as Response;
  const users = [
    { id: 'user-id', name: 'Ada Lovelace', email: 'ada@example.com' },
    { id: 'other-user-id', name: 'Grace Hopper', email: 'grace@example.com' }
  ] as User[];

  beforeEach(() => {
    queryBuilder = {
      select: jest.fn(),
      orderBy: jest.fn(),
      where: jest.fn(),
      getMany: jest.fn()
    };
    queryBuilder.select.mockReturnValue(mockDependency<SelectQueryBuilder<User>>(queryBuilder));
    queryBuilder.orderBy.mockReturnValue(mockDependency<SelectQueryBuilder<User>>(queryBuilder));
    queryBuilder.where.mockReturnValue(mockDependency<SelectQueryBuilder<User>>(queryBuilder));
    repository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder)
    };
    csvStream = {
      pipe: jest.fn(),
      write: jest.fn(),
      end: jest.fn()
    };
    formatMock.mockReturnValue(csvStream as never);
    handler = new ExportUsersCsvHandler(mockDependency<Repository<User>>(repository));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    formatMock.mockReset();
    loggerErrorSpy.mockRestore();
  });

  it('exports users matching the search query to csv', async () => {
    queryBuilder.getMany.mockResolvedValueOnce(users);

    await handler.execute(new ExportUsersCsvQuery({ q: 'ada' }, response));

    expect(repository.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(queryBuilder.select).toHaveBeenCalledWith(['user.name', 'user.email']);
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('user.updatedAt', 'DESC');
    expect(queryBuilder.where).toHaveBeenCalledWith('user.name LIKE :q OR user.email LIKE :q', { q: '%ada%' });
    expect(formatMock).toHaveBeenCalledWith({ headers: ['Name', 'Email'] });
    expect(csvStream.pipe).toHaveBeenCalledWith(response);
    expect(csvStream.write).toHaveBeenNthCalledWith(1, { Name: 'Ada Lovelace', Email: 'ada@example.com' });
    expect(csvStream.write).toHaveBeenNthCalledWith(2, { Name: 'Grace Hopper', Email: 'grace@example.com' });
    expect(csvStream.end).toHaveBeenCalledTimes(1);
  });

  it('exports all users when no search query is provided', async () => {
    queryBuilder.getMany.mockResolvedValueOnce(users);

    await handler.execute(new ExportUsersCsvQuery({}, response));

    expect(queryBuilder.where).not.toHaveBeenCalled();
    expect(csvStream.write).toHaveBeenCalledTimes(2);
  });

  it('throws BadRequestException when csv export fails unexpectedly', async () => {
    queryBuilder.getMany.mockRejectedValueOnce(new Error('database unavailable'));
    const promise = handler.execute(new ExportUsersCsvQuery({ q: 'ada' }, response));

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('Export des utilisateurs impossible');
  });
});
