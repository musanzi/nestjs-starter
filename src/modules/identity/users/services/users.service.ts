import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { promises } from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { RolesService } from '../../roles/services/roles.service';
import { FilterUsersInterface } from '../interfaces/filter-users.interface';
import { SignUpDto } from '../../../auth/dto/sign-up.dto';
import { parseUsersCsv } from '@/modules/identity/users/helpers/user-csv.helper';
import { AbstractRepository } from '@/modules/database/abstract.repository';
import { format } from 'fast-csv';
import { Response } from 'express';

@Injectable()
export class UsersService extends AbstractRepository<User> {
  constructor(
    @InjectRepository(User)
    repository: Repository<User>,
    private rolesService: RolesService
  ) {
    super(repository);
  }

  async create(dto: CreateUserDto): Promise<User> {
    try {
      return await this.createEntity({
        ...dto,
        password: 'user1234',
        roles: dto.roles?.map((id) => ({ id }))
      });
    } catch {
      throw new BadRequestException("Création de l'utilisateur impossible");
    }
  }

  async findAll(queryParams: FilterUsersInterface): Promise<[User[], number]> {
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
      const role = await this.rolesService.findByName('user');
      const newUser = await this.createEntity({
        email: dto.email,
        password: dto.password,
        roles: [{ id: role.id }]
      });
      return await this.findByEmail(newUser.email);
    } catch {
      throw new BadRequestException('Cet utilisateur existe déjà');
    }
  }

  async findOne(id: string): Promise<User> {
    try {
      const user = await this.findEntity({
        where: { id },
        relations: ['roles', 'mentor_profile']
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
        relations: ['roles', 'mentor_profile']
      });
      return this.mapUserRoles(user);
    } catch {
      throw new NotFoundException("Cet utilisateur n'existe pas");
    }
  }

  async addAvatar(currentUser: User, file: Express.Multer.File): Promise<User> {
    try {
      if (currentUser.avatar) await promises.unlink(`./uploads/profiles/${currentUser.avatar}`);
      await this.update(currentUser.id, { profile: file.filename });
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
        .leftJoinAndSelect('user.mentor_profile', 'mentor_profile')
        .where('user.email = :email', { email })
        .getOneOrFail();
      return this.mapUserRoles(user);
    } catch {
      throw new NotFoundException("Cet utilisateur n'existe pas");
    }
  }

  async exportCSV(queryParams: FilterUsersInterface, res: Response): Promise<void> {
    try {
      const { q } = queryParams;
      const query = this.repository
        .createQueryBuilder('user')
        .select(['user.name', 'user.email', 'user.phone_number'])
        .orderBy('user.updated_at', 'DESC');
      if (q) {
        query.where('user.name LIKE :q OR user.email LIKE :q', { q: `%${q}%` });
      }
      const users = await query.getMany();
      const csvStream = format({ headers: ['Name', 'Email', 'Phone Number'] });
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
      const role = await this.rolesService.findByName('user');
      const newUser = await this.createEntity({
        ...dto,
        roles: [role]
      });
      return await this.findOne(newUser.id);
    } catch {
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
        roles: dto.roles ? dto.roles.map((id) => ({ id })) : null
      });
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async remove(id: string): Promise<void> {
    await this.deleteEntity(id);
  }

  private mapUserRoles(user: User): User {
    const roles = user.roles.map((role) => role.name);
    return { ...user, roles } as unknown as User;
  }
}
