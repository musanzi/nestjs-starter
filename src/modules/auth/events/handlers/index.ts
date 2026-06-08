import { Provider } from '@nestjs/common';
import { SendResetPasswordEmailHandler } from './send-reset-password-email.handler';
import { SendWelcomeEmailHandler } from './send-welcome-email.handler';

export const EventHandlers: Provider[] = [SendResetPasswordEmailHandler, SendWelcomeEmailHandler];
