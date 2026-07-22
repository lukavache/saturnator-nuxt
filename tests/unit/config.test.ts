import { describe, expect, it } from 'vitest';
import { resolveX402Config, X402ConfigError } from '../../functions/api/x402/_lib/config';
import type { Env } from '../../functions/api/x402/_lib/types';

const VALID_ENV: Env = {
  X402_ENABLED: 'true',
  X402_NETWORK: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
  X402_FACILITATOR_URL: 'https://x402.org/facilitator',
  X402_DEFAULT_RECEIVER: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  X402_LICENSE_MIN_USD: '0.01',
  X402_SPOTLIGHT_PRICE_USD: '0.10',
  X402_SPOTLIGHT_WINDOW_HOURS: '24',
  X402_SIGNED_DOWNLOAD_TTL_SECONDS: '60',
  STRAPI_URL: 'https://api.example.com',
  STRAPI_API_TOKEN: 'secret-token',
};

describe('resolveX402Config', () => {
  it('resolves a fully valid config', () => {
    const config = resolveX402Config(VALID_ENV);
    expect(config.enabled).toBe(true);
    expect(config.strapiUrl).toBe('https://api.example.com');
    expect(config.spotlightWindowHours).toBe(24);
  });

  it('strips a trailing slash from STRAPI_URL', () => {
    const config = resolveX402Config({ ...VALID_ENV, STRAPI_URL: 'https://api.example.com/' });
    expect(config.strapiUrl).toBe('https://api.example.com');
  });

  it('skips validation entirely when x402 is disabled', () => {
    expect(() => resolveX402Config({ X402_ENABLED: 'false' })).not.toThrow();
  });

  it('fails fast when STRAPI_URL is missing while enabled', () => {
    const { STRAPI_URL, ...rest } = VALID_ENV;
    expect(() => resolveX402Config(rest)).toThrow(X402ConfigError);
  });

  it('fails fast when STRAPI_API_TOKEN is missing while enabled', () => {
    const { STRAPI_API_TOKEN, ...rest } = VALID_ENV;
    expect(() => resolveX402Config(rest)).toThrow(X402ConfigError);
  });

  it('fails fast on a malformed price decimal', () => {
    expect(() => resolveX402Config({ ...VALID_ENV, X402_LICENSE_MIN_USD: '0.1' })).toThrow(X402ConfigError);
    expect(() => resolveX402Config({ ...VALID_ENV, X402_SPOTLIGHT_PRICE_USD: 'free' })).toThrow(X402ConfigError);
  });

  it('fails fast on a malformed facilitator URL', () => {
    expect(() => resolveX402Config({ ...VALID_ENV, X402_FACILITATOR_URL: 'not-a-url' })).toThrow(X402ConfigError);
  });

  it('fails fast on a non-positive spotlight window', () => {
    expect(() => resolveX402Config({ ...VALID_ENV, X402_SPOTLIGHT_WINDOW_HOURS: '0' })).toThrow(X402ConfigError);
  });
});
