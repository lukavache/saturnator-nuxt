// Structured, secret-safe logging for x402 Pages Functions (Phase 5).
export type X402LogStatus =
  | 'ok'
  | 'error'
  | 'offer_rejected'
  | 'settlement_recorded'
  | 'settlement_failed'
  | 'rate_limited'
  | 'pending_entitlement';

export interface X402LogFields {
  requestId: string;
  status: X402LogStatus;
  message?: string;
  code?: string;
  trackId?: string;
  artistId?: string;
  purchaseId?: string;
  paymentId?: string;
  transactionSignature?: string;
  httpStatus?: number;
  path?: string;
}

const SENSITIVE = /authorization|bearer|cookie|password|private.?key|seed|x-payment|payment-signature/i;

function scrub(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === 'string') {
    if (value.length > 128 && /^[A-Za-z0-9+/=._-]{80,}$/.test(value)) {
      return `${value.slice(0, 12)}…(${value.length} chars)`;
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(scrub);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE.test(k) ? '[redacted]' : scrub(v);
    }
    return out;
  }
  return value;
}

export function newRequestId(): string {
  return `x402_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function x402Log(level: 'info' | 'warn' | 'error', fields: X402LogFields): void {
  const payload = scrub({
    scope: 'x402',
    ts: new Date().toISOString(),
    ...fields,
  });
  const line = JSON.stringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}
