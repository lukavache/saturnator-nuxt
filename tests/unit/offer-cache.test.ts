import { beforeEach, describe, expect, it } from 'vitest';
import { cacheOffer, consumeCachedOffer, getCachedOffer, __resetOfferCacheForTests } from '../../functions/api/x402/_lib/offer-cache';

describe('offer-cache', () => {
  beforeEach(() => {
    __resetOfferCacheForTests();
  });

  it('returns undefined for a key that was never cached', () => {
    expect(getCachedOffer('nope')).toBeUndefined();
  });

  it('round-trips a cached value via getCachedOffer without evicting it', () => {
    cacheOffer('key-1', { hello: 'world' });
    expect(getCachedOffer('key-1')).toEqual({ hello: 'world' });
    expect(getCachedOffer('key-1')).toEqual({ hello: 'world' }); // still there
  });

  it('consumeCachedOffer evicts the entry after reading it once', () => {
    cacheOffer('key-2', 42);
    expect(consumeCachedOffer('key-2')).toBe(42);
    expect(getCachedOffer('key-2')).toBeUndefined();
  });

  it('is a no-op when the key is undefined (unpaid/no-attempt requests)', () => {
    expect(cacheOffer(undefined, 'value')).toBe('value');
    expect(getCachedOffer(undefined)).toBeUndefined();
    expect(consumeCachedOffer(undefined)).toBeUndefined();
  });

  it('does not leak values across distinct payment-attempt keys', () => {
    cacheOffer('attempt-a', 'A');
    cacheOffer('attempt-b', 'B');
    expect(getCachedOffer('attempt-a')).toBe('A');
    expect(getCachedOffer('attempt-b')).toBe('B');
  });
});
