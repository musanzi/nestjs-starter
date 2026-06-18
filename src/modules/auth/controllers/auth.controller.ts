import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Request, Response } from 'express';
import { User } from '../../users/entities/user.entity';
import { IUserResponse } from '../../users/interfaces';
import { UpdateUserDto } from '../../users/dto/update-user.dto';
import { SignUpDto } from '../dto/sign-up.dto';
import { UpdatePasswordDto } from '@/modules/auth/dto/update-password.dto';
import { ForgotPasswordDto } from '@/modules/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '@/modules/auth/dto/reset-password.dto';
import { Public } from '../decorators/public.decorator';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import {
  ForgotPasswordCommand,
  ResetPasswordCommand,
  SignOutCommand,
  SignUpCommand,
  UpdatePasswordCommand,
  UpdateProfileCommand
} from '../commands';
import { GoogleRedirectQuery, ProfileQuery, SignInQuery } from '../queries';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post('signup')
  @Public()
  signUp(@Body() dto: SignUpDto): Promise<IUserResponse> {
    return this.commandBus.execute(new SignUpCommand(dto));
  }

  @Post('signin')
  @Public()
  @UseGuards(LocalAuthGuard)
  signIn(@Req() req: Request): Promise<IUserResponse> {
    return this.queryBus.execute(new SignInQuery(req));
  }

  @Get('signin/google')
  @Public()
  @UseGuards(GoogleAuthGuard)
  googleAuth(): void {}

  @Get('google/redirect')
  @Public()
  @UseGuards(GoogleAuthGuard)
  googleCallback(@Res() res: Response): Promise<void> {
    return this.queryBus.execute(new GoogleRedirectQuery(res));
  }

  @Post('signout')
  signOut(@Req() req: Request): Promise<void> {
    return this.commandBus.execute(new SignOutCommand(req));
  }

  @Get('me')
  profile(@CurrentUser() user: User): Promise<IUserResponse> {
    return this.queryBus.execute(new ProfileQuery(user));
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateUserDto): Promise<IUserResponse> {
    return this.commandBus.execute(new UpdateProfileCommand(user, dto));
  }

  @Patch('password')
  updatePassword(@CurrentUser() user: User, @Body() dto: UpdatePasswordDto): Promise<IUserResponse> {
    return this.commandBus.execute(new UpdatePasswordCommand(user, dto));
  }

  @Post('password/forgot')
  @Public()
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    return this.commandBus.execute(new ForgotPasswordCommand(dto));
  }

  @Post('password/reset')
  @Public()
  resetPassword(@Body() dto: ResetPasswordDto): Promise<IUserResponse> {
    return this.commandBus.execute(new ResetPasswordCommand(dto));
  }
}
