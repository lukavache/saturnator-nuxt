// Per-attempt offer cache, keyed by the request's X-PAYMENT header value
// (unique per payment attempt, available on HTTPRequestContext in every
// hook: payTo, price, and onAfterSettle). This satisfies the plan's "cache
// the resolved offer only within the request so payTo and price cannot
// observe different database versions" — and lets onAfterSettle re-use the
// EXACT same resolved offer (same DB snapshot) used to build the payment
// requirements, instead of re-querying Strapi and risking a race.
//
// Cloudflare Worker isolates can be reused across requests, so this is a
// short-lived, size-capped, TTL-evicted module-level cache — not a
// database. Entries are deleted as soon as they're consumed by
// onAfterSettle, and stale/unpaid attempts are swept on access.

const TTL_MS = 60_000; // an attempt should complete (or be abandoned) well within a minute
const MAX_ENTRIES = 200; // hard cap so a burst of unpaid requests can't leak memory

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

function sweepExpired(now: number) {
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}

export function cacheOffer<T>(key: string | undefined, value: T): T {
  if (!key) return value;
  const now = Date.now();
  sweepExpired(now);
  if (store.size >= MAX_ENTRIES) {
    // Evict the oldest entry (Map preserves insertion order) rather than
    // growing unbounded under a flood of unpaid/abandoned attempts.
    const oldestKey = store.keys().next().value;
    if (oldestKey !== undefined) store.delete(oldestKey);
  }
  store.set(key, { value, expiresAt: now + TTL_MS });
  return value;
}

export function getCachedOffer<T>(key: string | undefined): T | undefined {
  if (!key) return undefined;
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function consumeCachedOffer<T>(key: string | undefined): T | undefined {
  const value = getCachedOffer<T>(key);
  if (key) store.delete(key);
  return value;
}

/** Test-only: reset cache state between test cases. */
export function __resetOfferCacheForTests() {
  store.clear();
}
