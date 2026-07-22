// Self-contained x402 Pages Function smoke test:
// boots `wrangler pages dev` (official Cloudflare local preview), waits for the
// /api/x402/health function, runs the assertions in probe.mjs, then tears down.
import { spawn } from 'node:child_process'
import { checkUrl } from './probe.mjs'

const PORT = process.env.PROBE_PORT || '8788'
const URL = `http://127.0.0.1:${PORT}/api/x402/health`
const READY_TIMEOUT_MS = 90_000

function waitForReady(url, timeoutMs) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url, { headers: { accept: 'application/json' } })
        // Any HTTP response (402 expected) means the function is live.
        if (res.status) return resolve(true)
      } catch {
        // server not up yet
      }
      if (Date.now() - start > timeoutMs) return reject(new Error('Timed out waiting for wrangler pages dev'))
      setTimeout(tick, 1000)
    }
    tick()
  })
}

const child = spawn(
  'npx',
  ['wrangler', 'pages', 'dev', '--port', PORT, '--ip', '127.0.0.1'],
  { stdio: ['ignore', 'inherit', 'inherit'], env: process.env },
)

let exitCode = 1
try {
  await waitForReady(URL, READY_TIMEOUT_MS)
  const ok = await checkUrl(URL)
  exitCode = ok ? 0 : 1
} catch (e) {
  console.error('RUNNER ERROR:', e)
  exitCode = 2
} finally {
  child.kill('SIGTERM')
  setTimeout(() => process.exit(exitCode), 500)
}
