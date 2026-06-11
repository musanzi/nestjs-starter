import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { promises } from 'fs';
import { Repository } from 'typeorm';
import { mockDependency } from '@/shared/helpers';
import { User } from '../../entities/user.entity';
import { IUserResponse } from '../../interfaces';
import { FindUserByIdQuery } from '../../queries';
import { UploadUserAvatarCommand } from '../impl';
import { UploadUserAvatarHandler } from '../handlers/upload-user-avatar.handler';

describe('UploadUserAvatarHandler', () => {
  let repository: jest.Mocked<Pick<Repository<User>, 'update'>>;
  let queryBus: jest.Mocked<Pick<QueryBus, 'execute'>>;
  let handler: UploadUserAvatarHandler;
  let loggerErrorSpy: jest.SpyInstance;
  let unlinkSpy: jest.SpyInstance;

  const file = { filename: 'new-avatar.png' } as Express.Multer.File;
  const userResponse = {
    id: 'user-id',
    email: 'ada@example.com',
    avatar: 'new-avatar.png',
    roles: []
  } as IUserResponse;

  beforeEach(() => {
    repository = { update: jest.fn() };
    queryBus = { execute: jest.fn() };
    handler = new UploadUserAvatarHandler(
      mockDependency<Repository<User>>(repository),
      mockDependency<QueryBus>(queryBus)
    );
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    unlinkSpy = jest.spyOn(promises, 'unlink').mockResolvedValue(undefined);
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
    unlinkSpy.mockRestore();
  });

  it('removes the previous avatar, updates the user, and returns the refreshed user', async () => {
    repository.update.mockResolvedValueOnce({ affected: 1, raw: [], generatedMaps: [] });
    queryBus.execute.mockResolvedValueOnce(userResponse);

    const result = await handler.execute(
      new UploadUserAvatarCommand({ id: 'user-id', avatar: 'old-avatar.png' } as User, file)
    );

    expect(result).toBe(userResponse);
    expect(unlinkSpy).toHaveBeenCalledWith('./uploads/profiles/old-avatar.png');
    expect(repository.update).toHaveBeenCalledWith('user-id', { avatar: 'new-avatar.png' });
    expect(queryBus.execute).toHaveBeenCalledWith(new FindUserByIdQuery('user-id'));
  });

  it('updates the avatar without removing a file when the user has no current avatar', async () => {
    repository.update.mockResolvedValueOnce({ affected: 1, raw: [], generatedMaps: [] });
    queryBus.execute.mockResolvedValueOnce(userResponse);

    await handler.execute(new UploadUserAvatarCommand({ id: 'user-id', avatar: null } as User, file));

    expect(unlinkSpy).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith('user-id', { avatar: 'new-avatar.png' });
  });

  it('throws NotFoundException unchanged when the refreshed user cannot be found', async () => {
    repository.update.mockResolvedValueOnce({ affected: 1, raw: [], generatedMaps: [] });
    queryBus.execute.mockRejectedValueOnce(new NotFoundException('Utilisateur introuvable'));
    const promise = handler.execute(new UploadUserAvatarCommand({ id: 'user-id', avatar: null } as User, file));

    await expect(promise).rejects.toThrow(NotFoundException);
    await expect(promise).rejects.toThrow('Utilisateur introuvable');
  });

  it('throws BadRequestException when avatar upload handling fails unexpectedly', async () => {
    unlinkSpy.mockRejectedValueOnce(new Error('unlink failed'));
    const promise = handler.execute(
      new UploadUserAvatarCommand({ id: 'user-id', avatar: 'old-avatar.png' } as User, file)
    );

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow("Ajout d'image impossible");
    expect(repository.update).not.toHaveBeenCalled();
  });
});
