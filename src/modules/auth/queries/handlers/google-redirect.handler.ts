import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { GOOGLE_REDIRECT_TARGET_ADMIN, parseGoogleRedirectTarget } from '../../helpers/google-redirect-target.helper';
import { GoogleRedirect } from '../impl';

@QueryHandler(GoogleRedirect)
export class GoogleRedirectHandler implements IQueryHandler<GoogleRedirect, void> {
  constructor(private readonly configService: ConfigService) {}

  async execute(query: GoogleRedirect): Promise<void> {
    const frontendUri = this.configService.get<string>('FRONTEND_URI');
    const target = parseGoogleRedirectTarget(query.state);
    const redirectUri =
      target === GOOGLE_REDIRECT_TARGET_ADMIN
        ? this.configService.get<string>('ADMIN_URI') || frontendUri
        : frontendUri;

    query.response.redirect(redirectUri);
  }
}
