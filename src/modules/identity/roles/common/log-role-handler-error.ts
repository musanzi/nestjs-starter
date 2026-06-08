import { Logger } from '@nestjs/common';

export function logRoleHandlerError(logger: Logger, operation: string, error: unknown, context?: string): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const contextMessage = context ? ` (${context})` : '';

  logger.error(`${operation} failed${contextMessage}: ${message}`, stack);
}
