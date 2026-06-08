import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { GoogleRedirectQuery } from '../impl/google-redirect.query';

@QueryHandler(GoogleRedirectQuery)
export class GoogleRedirectHandler implements IQueryHandler<GoogleRedirectQuery, void> {
  constructor(private readonly configService: ConfigService) {}

  async execute(query: GoogleRedirectQuery): Promise<void> {
    const frontendUri = this.configService.get<string>('FRONTEND_URI');
    query.response.redirect(frontendUri);
  }
}
