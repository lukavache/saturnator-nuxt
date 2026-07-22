import { describe, expect, it } from 'vitest';
import { usdToAtomicUsdc } from '../../functions/api/x402/_lib/money';

describe('usdToAtomicUsdc', () => {
  it('converts whole dollar amounts', () => {
    expect(usdToAtomicUsdc('1.00')).toBe('1000000');
  });

  it('converts cents correctly without floating-point drift', () => {
    expect(usdToAtomicUsdc('0.01')).toBe('10000');
    expect(usdToAtomicUsdc('0.10')).toBe('100000');
    expect(usdToAtomicUsdc('12.34')).toBe('12340000');
  });

  it('handles the maximum 5-digit-dollar bound', () => {
    expect(usdToAtomicUsdc('99999.99')).toBe('99999990000');
  });

  it('throws on malformed input', () => {
    expect(() => usdToAtomicUsdc('1.5')).toThrow();
    expect(() => usdToAtomicUsdc('abc')).toThrow();
    expect(() => usdToAtomicUsdc('1.500')).toThrow();
    expect(() => usdToAtomicUsdc('')).toThrow();
  });
});
