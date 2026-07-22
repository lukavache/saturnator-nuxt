import { describe, expect, it } from 'vitest';
import { checkRateLimit, __resetRateLimitsForTests } from '../../functions/api/x402/_lib/rate-limit';
import { mapX402UserError } from '../../utils/x402-errors';

describe('rate-limit', () => {
  it('allows up to the limit then blocks', () => {
    __resetRateLimitsForTests();
    const now = 1_000_000;
    expect(checkRateLimit('a', 2, 60_000, now).allowed).toBe(true);
    expect(checkRateLimit('a', 2, 60_000, now).allowed).toBe(true);
    expect(checkRateLimit('a', 2, 60_000, now).allowed).toBe(false);
  });

  it('resets after the window', () => {
    __resetRateLimitsForTests();
    const now = 1_000_000;
    checkRateLimit('b', 1, 1000, now);
    expect(checkRateLimit('b', 1, 1000, now).allowed).toBe(false);
    expect(checkRateLimit('b', 1, 1000, now + 1001).allowed).toBe(true);
  });
});

describe('mapX402UserError', () => {
  it('maps known codes', () => {
    expect(mapX402UserError({ code: 'no_wallet' })).toMatch(/Phantom|Solflare/i);
    expect(mapX402UserError({ error: 'wallet_not_verified' })).toMatch(/verified/i);
  });

  it('maps wallet rejection patterns', () => {
    expect(mapX402UserError(new Error('User rejected the request'))).toMatch(/rejected/i);
  });
});
