import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { AbstractController } from '@/shared/abstracts';
import { User } from '../../users/entities/user.entity';
import { IUserResponse, UserResponse } from '../../users/interfaces';
import { UpdateUserDto } from '../../users/dto';
import { ForgotPasswordDto, ResetPasswordDto, SignInDto, SignUpDto, UpdatePasswordDto } from '../dto';
import { Public } from '../decorators/public.decorator';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ForgotPassword, ResetPassword, SignOut, SignUp, UpdatePassword, UpdateProfile } from '../commands';
import { GoogleRedirect, GetProfile, SignIn } from '../queries';

@ApiTags('auth')
@Controller('auth')
export class AuthController extends AbstractController {
  @Post('signup')
  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ type: UserResponse, description: 'User registered' })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  signUp(@Body() dto: SignUpDto): Promise<IUserResponse> {
    return this.commandHandler.execute(new SignUp(dto));
  }

  @Post('signin')
  @Public()
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiBody({ type: SignInDto })
  @ApiOkResponse({ type: UserResponse, description: 'Signed in' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  signIn(@Req() req: Request): Promise<IUserResponse> {
    return this.queryHandler.execute(new SignIn(req));
  }

  @Get('signin/google')
  @Public()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Start Google OAuth sign in' })
  googleAuth(): void {}

  @Get('google/redirect')
  @Public()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth redirect callback' })
  googleCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.queryHandler.execute(new GoogleRedirect(res, req.query.state));
  }

  @Post('signout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sign out the current user' })
  @ApiOkResponse({ description: 'Signed out' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  signOut(@Req() req: Request): Promise<void> {
    return this.commandHandler.execute(new SignOut(req));
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiOkResponse({ type: UserResponse, description: 'Current user profile' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  profile(@CurrentUser() user: User): Promise<IUserResponse> {
    return this.queryHandler.execute(new GetProfile(user.email));
  }

  @Patch('me/update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the current user profile' })
  @ApiOkResponse({ type: UserResponse, description: 'Profile updated' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateUserDto): Promise<IUserResponse> {
    return this.commandHandler.execute(new UpdateProfile(user, dto));
  }

  @Patch('password/update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the current user password' })
  @ApiOkResponse({ type: UserResponse, description: 'Password updated' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  updatePassword(@CurrentUser() user: User, @Body() dto: UpdatePasswordDto): Promise<IUserResponse> {
    return this.commandHandler.execute(new UpdatePassword(user, dto));
  }

  @Post('password/forgot')
  @Public()
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiOkResponse({ description: 'Password reset email sent' })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    return this.commandHandler.execute(new ForgotPassword(dto));
  }

  @Post('password/reset')
  @Public()
  @ApiOperation({ summary: 'Reset password with a token' })
  @ApiOkResponse({ type: UserResponse, description: 'Password reset' })
  @ApiBadRequestResponse({ description: 'Invalid or expired token' })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<IUserResponse> {
    return this.commandHandler.execute(new ResetPassword(dto));
  }
}
