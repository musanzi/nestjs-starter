import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AbstractController } from '@/shared/abstracts';
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
import { ForgotPassword, ResetPassword, SignOut, SignUp, UpdatePassword, UpdateProfile } from '../commands';
import { GoogleRedirect, GetProfile, SignIn } from '../queries';

@Controller('auth')
export class AuthController extends AbstractController {
  @Post('signup')
  @Public()
  signUp(@Body() dto: SignUpDto): Promise<IUserResponse> {
    return this.commandHandler.execute(new SignUp(dto.name, dto.email, dto.password));
  }

  @Post('signin')
  @Public()
  @UseGuards(LocalAuthGuard)
  signIn(@Req() req: Request): Promise<IUserResponse> {
    return this.queryHandler.execute(new SignIn(req));
  }

  @Get('signin/google')
  @Public()
  @UseGuards(GoogleAuthGuard)
  googleAuth(): void {}

  @Get('google/redirect')
  @Public()
  @UseGuards(GoogleAuthGuard)
  googleCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.queryHandler.execute(new GoogleRedirect(res, req.query.state));
  }

  @Post('signout')
  signOut(@Req() req: Request): Promise<void> {
    return this.commandHandler.execute(new SignOut(req));
  }

  @Get('me')
  profile(@CurrentUser() user: User): Promise<IUserResponse> {
    return this.queryHandler.execute(new GetProfile(user.email));
  }

  @Patch('me/update')
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateUserDto): Promise<IUserResponse> {
    return this.commandHandler.execute(
      new UpdateProfile(user, dto.email, dto.name, dto.password, dto.avatar, dto.roles)
    );
  }

  @Patch('password/update')
  updatePassword(@CurrentUser() user: User, @Body() dto: UpdatePasswordDto): Promise<IUserResponse> {
    return this.commandHandler.execute(new UpdatePassword(user, dto.password));
  }

  @Post('password/forgot')
  @Public()
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    return this.commandHandler.execute(new ForgotPassword(dto.email));
  }

  @Post('password/reset')
  @Public()
  resetPassword(@Body() dto: ResetPasswordDto): Promise<IUserResponse> {
    return this.commandHandler.execute(new ResetPassword(dto.token, dto.password));
  }
}
