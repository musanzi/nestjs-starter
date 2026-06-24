import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard, IAuthModuleOptions } from '@nestjs/passport';
import { Request } from 'express';
import { parseGoogleRedirectTarget } from '../helpers/google-redirect-target.helper';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext): IAuthModuleOptions | undefined {
    const request = context.switchToHttp().getRequest<Request>();
    const target = parseGoogleRedirectTarget(request.query.target);

    return target ? { state: target } : undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const canActivate = (await super.canActivate(context)) as boolean;
    const request = context.switchToHttp().getRequest<Request>();

    await super.logIn(request);

    return canActivate;
  }
}
