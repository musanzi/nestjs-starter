import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { User } from '../../users/entities/user.entity';
import { SignUpDto } from '../dto/sign-up.dto';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UpdateUserDto } from '../../users/dto/update-user.dto';
import { compare } from 'bcryptjs';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import { FindOrCreateUserCommand } from '@/modules/users/commands';
import { FindUserByEmailQuery, FindUserByEmailWithPasswordQuery, FindUserByIdQuery } from '@/modules/users/queries';
import {
  ForgotPasswordCommand,
  ResetPasswordCommand,
  SignUpCommand,
  UpdatePasswordCommand,
  UpdateProfileCommand
} from '../commands';

@Injectable()
export class AuthService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.queryBus.execute(new FindUserByEmailWithPasswordQuery(email));
    if (!user || !user.password) throw new UnauthorizedException('Les identifiants saisis sont invalides');
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Les identifiants saisis sont invalides');
    return await this.queryBus.execute(new FindUserByEmailQuery(user.email));
  }

  async findOrCreate(dto: CreateUserDto): Promise<User> {
    try {
      return await this.commandBus.execute(new FindOrCreateUserCommand(dto));
    } catch {
      throw new BadRequestException('Requête invalide');
    }
  }

  async signInWithGoogle(res: Response): Promise<void> {
    const frontendUri = this.configService.get<string>('FRONTEND_URI');
    return res.redirect(frontendUri);
  }

  async signIn(req: Request): Promise<User> {
    return req['user'] as User;
  }

  async signUp(dto: SignUpDto): Promise<User> {
    try {
      return await this.commandBus.execute(new SignUpCommand(dto));
    } catch (error) {
      throw new BadRequestException(error['message']);
    }
  }

  signOut(req: Request): void {
    req.session.destroy(() => {});
  }

  async verifyToken(token: string): Promise<User> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });
      return await this.queryBus.execute(new FindUserByIdQuery(payload.sub));
    } catch {
      throw new UnauthorizedException('Non autorisé');
    }
  }

  async profile(user: User): Promise<User> {
    return this.queryBus.execute(new FindUserByEmailQuery(user.email));
  }

  async updateProfile(user: User, dto: UpdateUserDto): Promise<User> {
    try {
      return await this.commandBus.execute(new UpdateProfileCommand(user, dto));
    } catch {
      throw new BadRequestException('Requête invalide');
    }
  }

  async updatePassword(currentUser: User, dto: UpdatePasswordDto): Promise<User> {
    try {
      return await this.commandBus.execute(new UpdatePasswordCommand(currentUser, dto));
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    try {
      await this.commandBus.execute(new ForgotPasswordCommand(dto));
    } catch {
      throw new BadRequestException('Demande invalide');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<User> {
    try {
      return await this.commandBus.execute(new ResetPasswordCommand(resetPasswordDto));
    } catch {
      throw new BadRequestException('Mot de passe invalide');
    }
  }
}
