// Auth helpers shared by x402 hooks and download proxy.
import type { HTTPRequestContext } from '@x402/core/server';
import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';

export const AUTH_COOKIE = 'saturnator_jwt';

export function bearerFromHeader(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1] : undefined;
}

/** Prefer Authorization header; fall back to short-lived paywall cookie. */
export function extractJwtFromContext(context: HTTPRequestContext): string | undefined {
  const fromHeader = bearerFromHeader(context.adapter.getHeader('authorization'));
  if (fromHeader) return fromHeader;

  const cookieHeader = context.adapter.getHeader('cookie');
  if (!cookieHeader) return undefined;
  const match = new RegExp(`(?:^|;\\s*)${AUTH_COOKIE}=([^;]+)`).exec(cookieHeader);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function extractJwtFromHono(c: Context): string | undefined {
  const fromHeader = bearerFromHeader(c.req.header('authorization'));
  if (fromHeader) return fromHeader;
  return getCookie(c, AUTH_COOKIE) || undefined;
}
