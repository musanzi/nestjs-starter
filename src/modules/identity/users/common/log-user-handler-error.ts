import { Logger } from '@nestjs/common';

export function logUserHandlerError(logger: Logger, operation: string, error: unknown, context?: string): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const suffix = context ? ` ${context}` : '';
  logger.error(`${operation} failed:${suffix} ${message}`, stack);
}
