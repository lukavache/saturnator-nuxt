// Task 2.1: validated runtime configuration.
// Fails fast (throws) if x402 is enabled but required values are missing or
// invalid, instead of silently starting in a half-broken state.
import type { Env } from './types';

export interface X402Config {
  enabled: boolean;
  network: string;
  facilitatorUrl: string;
  defaultReceiver: string;
  licenseMinUsd: string;
  spotlightPriceUsd: string;
  spotlightWindowHours: number;
  signedDownloadTtlSeconds: number;
  strapiUrl: string;
  strapiApiToken: string;
}

const DEFAULTS = {
  network: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1', // Solana Devnet
  facilitatorUrl: 'https://x402.org/facilitator',
  licenseMinUsd: '0.01',
  spotlightPriceUsd: '0.10',
  spotlightWindowHours: 24,
  signedDownloadTtlSeconds: 60,
};

const DECIMAL_USD_RE = /^\d{1,5}\.\d{2}$/;

export class X402ConfigError extends Error {}

/**
 * Resolves and validates config from the Pages Function `env`. Throws
 * `X402ConfigError` if x402 is enabled but a required value is absent or
 * malformed — this is deliberately loud (500) rather than silently
 * degrading to a broken payment flow.
 */
export function resolveX402Config(env: Env): X402Config {
  const enabled = (env.X402_ENABLED ?? 'true') === 'true';

  const network = env.X402_NETWORK || DEFAULTS.network;
  const facilitatorUrl = env.X402_FACILITATOR_URL || DEFAULTS.facilitatorUrl;
  const defaultReceiver = env.X402_DEFAULT_RECEIVER || '';
  const licenseMinUsd = env.X402_LICENSE_MIN_USD || DEFAULTS.licenseMinUsd;
  const spotlightPriceUsd = env.X402_SPOTLIGHT_PRICE_USD || DEFAULTS.spotlightPriceUsd;
  const spotlightWindowHours = Number(env.X402_SPOTLIGHT_WINDOW_HOURS || DEFAULTS.spotlightWindowHours);
  const signedDownloadTtlSeconds = Number(
    env.X402_SIGNED_DOWNLOAD_TTL_SECONDS || DEFAULTS.signedDownloadTtlSeconds,
  );
  const strapiUrl = (env.STRAPI_URL || '').replace(/\/+$/, '');
  const strapiApiToken = env.STRAPI_API_TOKEN || '';

  if (!enabled) {
    return {
      enabled: false,
      network,
      facilitatorUrl,
      defaultReceiver,
      licenseMinUsd,
      spotlightPriceUsd,
      spotlightWindowHours,
      signedDownloadTtlSeconds,
      strapiUrl,
      strapiApiToken,
    };
  }

  const problems: string[] = [];
  if (!network.includes(':')) problems.push('X402_NETWORK must be a CAIP-2 id (e.g. "solana:...")');
  if (!/^https?:\/\//.test(facilitatorUrl)) problems.push('X402_FACILITATOR_URL must be a valid URL');
  if (!DECIMAL_USD_RE.test(licenseMinUsd)) problems.push('X402_LICENSE_MIN_USD must be a decimal string like "0.01"');
  if (!DECIMAL_USD_RE.test(spotlightPriceUsd)) problems.push('X402_SPOTLIGHT_PRICE_USD must be a decimal string like "0.10"');
  if (!Number.isFinite(spotlightWindowHours) || spotlightWindowHours <= 0) {
    problems.push('X402_SPOTLIGHT_WINDOW_HOURS must be a positive number');
  }
  if (!Number.isFinite(signedDownloadTtlSeconds) || signedDownloadTtlSeconds <= 0) {
    problems.push('X402_SIGNED_DOWNLOAD_TTL_SECONDS must be a positive number');
  }
  if (!strapiUrl) problems.push('STRAPI_URL is required when x402 is enabled (server-side secret/var)');
  if (!strapiApiToken) problems.push('STRAPI_API_TOKEN is required when x402 is enabled (Pages secret)');

  if (problems.length > 0) {
    throw new X402ConfigError(`Invalid x402 configuration: ${problems.join('; ')}`);
  }

  return {
    enabled,
    network,
    facilitatorUrl,
    defaultReceiver,
    licenseMinUsd,
    spotlightPriceUsd,
    spotlightWindowHours,
    signedDownloadTtlSeconds,
    strapiUrl,
    strapiApiToken,
  };
}
