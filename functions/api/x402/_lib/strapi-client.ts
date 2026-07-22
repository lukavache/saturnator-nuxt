// Thin fetch wrapper for saturnator-api (Strapi) calls made FROM the
// Cloudflare Pages Function using the scoped, server-side Strapi API token.
// This token must be a Strapi "Full access" (or narrowly scoped, see docs)
// API token — never a user JWT — and is only ever read from Pages secrets.
import type { X402Config } from './config';

export class StrapiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
  }
}

export async function strapiFetch<T = unknown>(
  config: X402Config,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${config.strapiUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.strapiApiToken}`,
      'content-type': 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    },
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    throw new StrapiRequestError(
      `Strapi request failed: ${init.method || 'GET'} ${path} -> ${response.status}`,
      response.status,
      body,
    );
  }

  return body as T;
}

/** Verifies a user's Strapi JWT by asking Strapi who it belongs to (never decoded locally). */
export async function verifyStrapiJwt(
  config: X402Config,
  jwt: string,
): Promise<{ id: number; username: string } | null> {
  try {
    const response = await fetch(`${config.strapiUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (!response.ok) return null;
    const user = (await response.json()) as { id: number; username: string };
    return user;
  } catch {
    return null;
  }
}
