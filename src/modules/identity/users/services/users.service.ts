import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { promises } from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { IFilterUsers } from '../interfaces/filter-users.interface';
import { SignUpDto } from '../../../auth/dto/sign-up.dto';
import { parseUsersCsv } from '@/modules/identity/users/helpers/user-csv.helper';
import { AbstractRepository } from '@/modules/database/abstract.repository';
import { format } from 'fast-csv';
import { Response } from 'express';
import { QueryBus } from '@nestjs/cqrs';
import { FindRoleByNameQuery } from '../../roles/queries';
import { Role } from '../../roles/entities/role.entity';
import { mapRoleIds, mapUserRoles } from '../common/user-mappers';

@Injectable()
export class UsersService extends AbstractRepository<User> {
  constructor(
    @InjectRepository(User)
    repository: Repository<User>,
    private readonly queryBus: QueryBus
  ) {
    super(repository);
  }

  async create(dto: CreateUserDto): Promise<User> {
    try {
      return await this.createEntity({
        ...dto,
        password: 'user1234',
        roles: mapRoleIds(dto.roles)
      });
    } catch {
      throw new BadRequestException("Création de l'utilisateur impossible");
    }
  }

  async findAll(queryParams: IFilterUsers): Promise<[User[], number]> {
    try {
      const { page, q } = queryParams;
      const query = this.repository.createQueryBuilder('u');
      if (q) query.where('u.name LIKE :q OR u.email LIKE :q', { q: `%${q}%` });
      return await this.findPaginatedEntities(query, { page, take: 50 });
    } catch {
      throw new BadRequestException('Utilisateurs introuvables');
    }
  }

  async signUp(dto: SignUpDto): Promise<User> {
    try {
      const role = await this.queryBus.execute<FindRoleByNameQuery, Role>(new FindRoleByNameQuery('user'));
      const newUser = await this.createEntity({
        email: dto.email,
        password: dto.password,
        roles: [{ id: role.id }]
      });
      return await this.findByEmail(newUser.email);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Cet utilisateur existe déjà');
    }
  }

  async findOne(id: string): Promise<User> {
    try {
      const user = await this.findEntity({
        where: { id },
        relations: ['roles']
      });
      return this.mapUserRoles(user);
    } catch {
      throw new BadRequestException('Utilisateur introuvable');
    }
  }

  async findByEmail(email: string): Promise<User> {
    try {
      const user = await this.findEntity({
        where: { email },
        relations: ['roles']
      });
      return this.mapUserRoles(user);
    } catch {
      throw new NotFoundException("Cet utilisateur n'existe pas");
    }
  }

  async addAvatar(currentUser: User, file: Express.Multer.File): Promise<User> {
    try {
      if (currentUser.avatar) await promises.unlink(`./uploads/profiles/${currentUser.avatar}`);
      await this.update(currentUser.id, { avatar: file.filename });
      return this.findByEmail(currentUser.email);
    } catch {
      throw new BadRequestException("Ajout d'image impossible");
    }
  }

  async findByEmailWithPassword(email: string): Promise<User> {
    try {
      const user = await this.repository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .leftJoinAndSelect('user.roles', 'roles')
        .where('user.email = :email', { email })
        .getOneOrFail();
      return this.mapUserRoles(user);
    } catch {
      throw new NotFoundException("Cet utilisateur n'existe pas");
    }
  }

  async exportCSV(queryParams: IFilterUsers, res: Response): Promise<void> {
    try {
      const { q } = queryParams;
      const query = this.repository
        .createQueryBuilder('user')
        .select(['user.name', 'user.email'])
        .orderBy('user.updated_at', 'DESC');
      if (q) {
        query.where('user.name LIKE :q OR user.email LIKE :q', { q: `%${q}%` });
      }
      const users = await query.getMany();
      const csvStream = format({ headers: ['Name', 'Email'] });
      csvStream.pipe(res);
      users.forEach((user) => {
        csvStream.write({ Name: user.name, Email: user.email });
      });
      csvStream.end();
    } catch {
      throw new BadRequestException('Export des utilisateurs impossible');
    }
  }

  async findOneByEmail(email: string): Promise<User> {
    try {
      return await this.findEntity({
        where: { email },
        relations: ['roles']
      });
    } catch {
      throw new NotFoundException("Cet utilisateur n'existe pas");
    }
  }

  async findOrCreate(dto: CreateUserDto): Promise<User> {
    try {
      const user = await this.findEntity({
        where: { email: dto.email }
      });
      if (user) {
        return await this.update(user.id, {
          avatar: !user.avatar && dto.avatar
        });
      }
      const role = await this.queryBus.execute<FindRoleByNameQuery, Role>(new FindRoleByNameQuery('user'));
      const newUser = await this.createEntity({
        ...dto,
        roles: [role]
      });
      return await this.findOne(newUser.id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException("Création de l'utilisateur impossible");
    }
  }

  async importCsv(file: Express.Multer.File): Promise<void> {
    try {
      const rows = await parseUsersCsv(file.buffer);
      for (const row of rows) {
        await this.findOrCreate(row);
      }
    } catch {
      throw new BadRequestException('Import des utilisateurs impossible');
    }
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    try {
      return await this.updateEntity(id, {
        ...dto,
        roles: dto.roles ? mapRoleIds(dto.roles) : null
      });
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async remove(id: string): Promise<void> {
    await this.deleteEntity(id);
  }

  private mapUserRoles(user: User): User {
    return mapUserRoles(user);
  }
}
