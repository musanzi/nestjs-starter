import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { EventBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { User } from '../../identity/users/entities/user.entity';
import { UsersService } from '../../identity/users/services/users.service';
import { SignUpDto } from '../dto/sign-up.dto';
import { CreateUserDto } from '../../identity/users/dto/create-user.dto';
import { UpdateUserDto } from '../../identity/users/dto/update-user.dto';
import { compare } from 'bcryptjs';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import { createAuthToken } from '../common/create-auth-token';
import { ResetPasswordRequestedEvent } from '../events';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly eventBus: EventBus,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user || !user.password) throw new UnauthorizedException('Les identifiants saisis sont invalides');
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Les identifiants saisis sont invalides');
    return await this.usersService.findByEmail(user.email);
  }

  async findOrCreate(dto: CreateUserDto): Promise<User> {
    try {
      return await this.usersService.findOrCreate(dto);
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
      return await this.usersService.signUp(dto);
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
      return await this.usersService.findOne(payload.sub);
    } catch {
      throw new UnauthorizedException('Non autorisé');
    }
  }

  async profile(user: User): Promise<User> {
    return this.usersService.findByEmail(user.email);
  }

  async updateProfile(user: User, dto: UpdateUserDto): Promise<User> {
    try {
      return await this.usersService.update(user.id, dto);
    } catch {
      throw new BadRequestException('Requête invalide');
    }
  }

  async updatePassword(currentUser: User, dto: UpdatePasswordDto): Promise<User> {
    try {
      await this.usersService.update(currentUser.id, { password: dto.password });
      return await this.usersService.findByEmail(currentUser.email);
    } catch {
      throw new BadRequestException('Mise à jour impossible');
    }
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    try {
      const user = await this.usersService.findByEmail(dto.email);
      const token = await createAuthToken(this.jwtService, this.configService, user, '15m');
      const frontendUri = this.configService.get<string>('FRONTEND_URI');
      const link = `${frontendUri}/reset-password?token=${token}`;
      this.eventBus.publish(new ResetPasswordRequestedEvent(user, link));
    } catch {
      throw new BadRequestException('Demande invalide');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<User> {
    const { token, password } = resetPasswordDto;
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });
      return await this.usersService.update(payload.sub, { password });
    } catch {
      throw new BadRequestException('Mot de passe invalide');
    }
  }
}
