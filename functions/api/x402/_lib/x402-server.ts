// Task 2.2: one x402 resource server singleton per isolate.
//
// - One HTTPFacilitatorClient.
// - One x402ResourceServer, registered for the configured Solana network.
// - `onAfterSettle` registered exactly once here (not per-request, not per-route).
// Never call `new x402ResourceServer(...)` anywhere else in this codebase.
import { x402ResourceServer } from '@x402/hono';
import { HTTPFacilitatorClient, type HTTPTransportContext, type SettleResultContext } from '@x402/core/server';
import type { Network } from '@x402/core/types';
import { ExactSvmScheme } from '@x402/svm/exact/server';
import type { X402Config } from './config';
import { peekLicenseAttempt, peekSponsorshipAttempt } from './attempt-resolution';
import { recordLicenseSettlement, recordSponsorshipSettlement, type SettledPaymentFacts } from './settlement';

let cachedServer: x402ResourceServer | null = null;
let cachedForNetwork: string | null = null;

function settledFactsFrom(context: SettleResultContext): SettledPaymentFacts {
  return {
    transactionSignature: context.result.transaction,
    payerWallet: context.result.payer,
    payTo: context.requirements.payTo,
    network: context.requirements.network,
    assetMint: context.requirements.asset,
    amountAtomic: context.requirements.amount,
  };
}

/**
 * Builds the onAfterSettle hook function. Exported standalone (not just
 * inline in getX402Server) so it can be unit tested directly against a
 * fake SettleResultContext without spinning up a real x402ResourceServer —
 * see tests/unit/x402-onAfterSettle.test.ts (Task 2.4: "failed settlement
 * creates no entitlement/boost").
 */
export function buildOnAfterSettleHook(config: X402Config) {
  return async function onAfterSettle(context: SettleResultContext): Promise<void> {
    if (!context.result.success) return; // defensive; hook should only fire on success

    const transport = context.transportContext as HTTPTransportContext | undefined;
    const paymentHeader = transport?.request?.paymentHeader;
    const settled = settledFactsFrom(context);

    // Peek, don't consume: the downstream route handler (which runs after
    // this hook, once `next()` is called) still needs the same resolved
    // offer to render its response, and is what finally evicts the entry.
    const licenseAttempt = peekLicenseAttempt(paymentHeader);
    if (licenseAttempt) {
      try {
        const { offer, buyerId } = await licenseAttempt;
        await recordLicenseSettlement(config, offer, buyerId, settled);
      } catch (error) {
        // Task 2.4: never let a persistence failure re-litigate an
        // already-settled on-chain payment. Report loudly; the MVP
        // reconciliation path is a manual replay from the logged facts.
        // eslint-disable-next-line no-console
        console.error('[x402] failed to record license settlement', {
          transactionSignature: settled.transactionSignature,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      return;
    }

    const sponsorshipAttempt = peekSponsorshipAttempt(paymentHeader);
    if (sponsorshipAttempt) {
      try {
        const { offer, sponsorId } = await sponsorshipAttempt;
        await recordSponsorshipSettlement(config, offer, sponsorId, settled);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[x402] failed to record sponsorship settlement', {
          transactionSignature: settled.transactionSignature,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      return;
    }

    // No cached attempt (cache expired/evicted, or health-probe route with
    // no attempt tracking). Nothing to record — logged for visibility.
    // eslint-disable-next-line no-console
    console.warn('[x402] onAfterSettle: no cached offer attempt for this payment header', {
      transactionSignature: settled.transactionSignature,
    });
  };
}

/**
 * Builds (once per isolate / config) the shared x402ResourceServer with
 * onAfterSettle wired for BOTH the license and sponsorship flows. Both
 * route handlers share this one instance — see [[route]].ts.
 */
export function getX402Server(config: X402Config): x402ResourceServer {
  if (cachedServer && cachedForNetwork === config.network) return cachedServer;

  const facilitator = new HTTPFacilitatorClient({ url: config.facilitatorUrl });
  const server = new x402ResourceServer(facilitator)
    .register(config.network as Network, new ExactSvmScheme())
    .onAfterSettle(buildOnAfterSettleHook(config));

  cachedServer = server;
  cachedForNetwork = config.network;
  return server;
}

/** Test-only: force a rebuild on next getX402Server() call. */
export function __resetX402ServerForTests() {
  cachedServer = null;
  cachedForNetwork = null;
}
