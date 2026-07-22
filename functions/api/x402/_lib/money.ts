// Decimal-safe USD -> atomic USDC (6 decimals) conversion. No floating-point
// arithmetic — matches the "no floating point" rule already applied to
// `licensePriceUsd` in saturnator-api. Input must already be validated as
// `^\d{1,5}\.\d{2}$` (see saturnator-api's `license-price.ts`).
const USDC_DECIMALS = 6n;
const USDC_SCALE = 10n ** USDC_DECIMALS;

export function usdToAtomicUsdc(usd: string): string {
  const match = /^(\d{1,5})\.(\d{2})$/.exec(usd.trim());
  if (!match) {
    throw new Error(`usdToAtomicUsdc: expected a "D.DD" decimal string, got "${usd}"`);
  }
  const [, dollars, cents] = match;
  const atomic = BigInt(dollars) * USDC_SCALE + BigInt(cents) * (USDC_SCALE / 100n);
  return atomic.toString();
}
