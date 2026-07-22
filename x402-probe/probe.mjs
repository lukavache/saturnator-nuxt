// x402 Cloudflare Pages runtime smoke test (regression check — keep this file).
// Sends an UNPAID request to the /api/x402/health Pages Function and asserts a
// correct x402 v2 Solana Devnet 402 response. Reused by run-pages-probe.mjs.
const DEFAULT_URL = 'http://127.0.0.1:8788/api/x402/health'
const EXPECTED_NETWORK = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1' // Solana Devnet
const EXPECTED_PAYTO = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
const EXPECTED_AMOUNT = '1000' // $0.001 USDC (6 decimals)

export async function checkUrl(url = DEFAULT_URL) {
  const res = await fetch(url, {
    method: 'GET',
    headers: { accept: 'application/json' },
  })

  const headers = {}
  res.headers.forEach((v, k) => (headers[k] = v))

  const prHeader = res.headers.get('payment-required')
  let decoded
  if (prHeader) {
    decoded = JSON.parse(Buffer.from(prHeader, 'base64').toString('utf8'))
  }
  const accepts = Array.isArray(decoded?.accepts) ? decoded.accepts[0] : undefined

  const checks = {
    'HTTP 402': res.status === 402,
    'PAYMENT-REQUIRED header exists': !!prHeader,
    'PAYMENT-REQUIRED exposed via CORS': (headers['access-control-expose-headers'] || '')
      .toLowerCase()
      .includes('payment-required'),
    'PAYMENT-RESPONSE exposed via CORS': (headers['access-control-expose-headers'] || '')
      .toLowerCase()
      .includes('payment-response'),
    'x402Version === 2': decoded?.x402Version === 2,
    'network is Solana Devnet': accepts?.network === EXPECTED_NETWORK,
    'payTo is configured receiver': accepts?.payTo === EXPECTED_PAYTO,
    'scheme exact': accepts?.scheme === 'exact',
    'amount is atomic USDC ($0.001 => 1000)': accepts?.amount === EXPECTED_AMOUNT,
  }

  console.log('=== URL ===', url)
  console.log('=== STATUS ===', res.status)
  console.log('=== RESPONSE HEADERS ===')
  console.log(JSON.stringify(headers, null, 2))
  console.log('=== DECODED PAYMENT-REQUIRED ===')
  console.log(JSON.stringify(decoded, null, 2))
  console.log('=== CHECKS ===')
  for (const [k, v] of Object.entries(checks)) console.log(`${v ? 'PASS' : 'FAIL'}  ${k}`)

  const allPass = Object.values(checks).every(Boolean)
  console.log('\n=== RESULT ===', allPass ? 'ALL PASS' : 'FAILURES PRESENT')
  return allPass
}

// Run standalone: `node x402-probe/probe.mjs [url]`
if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.argv[2] || process.env.PROBE_URL || DEFAULT_URL
  checkUrl(url)
    .then((ok) => process.exit(ok ? 0 : 1))
    .catch((e) => {
      console.error('PROBE ERROR:', e)
      process.exit(2)
    })
}
