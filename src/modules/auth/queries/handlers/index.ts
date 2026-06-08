import { GoogleRedirectHandler } from './google-redirect.handler';
import { ProfileHandler } from './profile.handler';
import { SignInHandler } from './sign-in.handler';
import { ValidateCredentialsHandler } from './validate-credentials.handler';

export const QueryHandlers = [SignInHandler, GoogleRedirectHandler, ProfileHandler, ValidateCredentialsHandler];
