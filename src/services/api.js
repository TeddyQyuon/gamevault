// Authenticated API client. Cookies carry the session (credentials: 'include');
// the browser never sees secrets and never sends user/customer ids —
// ownership is resolved server-side from the session cookie.

// Works under Vite (import.meta.env) and plain node (tests) alike.
const BASE = globalThis.__GV_API_BASE ?? import.meta.env?.VITE_API_BASE ?? ''

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the GameVault API. Is the backend running (npm run dev in server/)?')
  }
  const contentType = res.headers?.get?.('content-type') || ''
  if (contentType.includes('text/html')) {
    throw new ApiError(503, 'BACKEND_UNAVAILABLE', 'GameVault API route not found or backend unavailable.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = data?.error || {}
    throw new ApiError(res.status, err.code || 'REQUEST_FAILED', err.message || 'Request failed.', err.details)
  }
  return data
}

export const apiGet = (path) => api(path)
export const apiPost = (path, body) => api(path, { method: 'POST', body })
export const apiPatch = (path, body) => api(path, { method: 'PATCH', body })

// Stripe mode from the public health endpoint ('test-mode' | 'live' |
// 'unconfigured'). Cached for the session. Fail-safe: when the backend can't
// be reached we report 'unconfigured', and payment copy must then assume REAL
// charges (never promise "no real charge" unless test-mode is confirmed).
let stripeModeCache = null

export function getStripeMode() {
  if (!stripeModeCache) {
    stripeModeCache = apiGet('/api/health')
      .then((d) => (d?.stripe === 'live' ? 'live' : d?.stripe === 'test-mode' ? 'test-mode' : 'unconfigured'))
      .catch(() => 'unconfigured')
  }
  return stripeModeCache
}

export function __resetStripeModeCache() {
  stripeModeCache = null
}
