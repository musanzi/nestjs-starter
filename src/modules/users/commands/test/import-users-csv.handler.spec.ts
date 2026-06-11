import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { mockDependency } from '@/shared/helpers';
import { parseUsersCsv } from '../../helpers/user-csv.helper';
import { FindOrCreateUserCommand, ImportUsersCsvCommand } from '../impl';
import { ImportUsersCsvHandler } from '../handlers/import-users-csv.handler';

jest.mock('../../helpers/user-csv.helper', () => ({
  parseUsersCsv: jest.fn()
}));

describe('ImportUsersCsvHandler', () => {
  let commandBus: jest.Mocked<Pick<CommandBus, 'execute'>>;
  let handler: ImportUsersCsvHandler;
  let loggerErrorSpy: jest.SpyInstance;
  const parseUsersCsvMock = parseUsersCsv as jest.MockedFunction<typeof parseUsersCsv>;
  const file = { buffer: Buffer.from('Name,Email\nAda,ada@example.com') } as Express.Multer.File;

  beforeEach(() => {
    commandBus = { execute: jest.fn() };
    handler = new ImportUsersCsvHandler(mockDependency<CommandBus>(commandBus));
    parseUsersCsvMock.mockReset();
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('imports each parsed csv row through find or create user commands', async () => {
    const rows = [
      { name: 'Ada Lovelace', email: 'ada@example.com' },
      { name: 'Grace Hopper', email: 'grace@example.com' }
    ];
    parseUsersCsvMock.mockResolvedValueOnce(rows);
    commandBus.execute.mockResolvedValue(undefined);

    await handler.execute(new ImportUsersCsvCommand(file));

    expect(parseUsersCsvMock).toHaveBeenCalledWith(file.buffer);
    expect(commandBus.execute).toHaveBeenNthCalledWith(1, new FindOrCreateUserCommand(rows[0]));
    expect(commandBus.execute).toHaveBeenNthCalledWith(2, new FindOrCreateUserCommand(rows[1]));
  });

  it('throws NotFoundException unchanged when a row import reports not found', async () => {
    parseUsersCsvMock.mockResolvedValueOnce([{ name: 'Ada Lovelace', email: 'ada@example.com' }]);
    commandBus.execute.mockRejectedValueOnce(new NotFoundException('Rôle introuvable'));
    const promise = handler.execute(new ImportUsersCsvCommand(file));

    await expect(promise).rejects.toThrow(NotFoundException);
    await expect(promise).rejects.toThrow('Rôle introuvable');
  });

  it('throws BadRequestException when csv import fails unexpectedly', async () => {
    parseUsersCsvMock.mockRejectedValueOnce(new Error('parse failed'));
    const promise = handler.execute(new ImportUsersCsvCommand(file));

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('Import des utilisateurs impossible');
    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
