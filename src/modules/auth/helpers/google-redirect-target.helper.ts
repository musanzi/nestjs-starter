export const GOOGLE_REDIRECT_TARGET_ADMIN = 'admin';

export type GoogleRedirectTarget = typeof GOOGLE_REDIRECT_TARGET_ADMIN;

export function parseGoogleRedirectTarget(target: unknown): GoogleRedirectTarget | undefined {
  return target === GOOGLE_REDIRECT_TARGET_ADMIN ? GOOGLE_REDIRECT_TARGET_ADMIN : undefined;
}
