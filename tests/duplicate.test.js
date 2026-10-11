import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createOneTimeSession, __resetSessionGuard } from '../src/services/orderService.js'

// The in-flight guard stops double taps / double submits from firing two
// session requests. The SERVER fingerprint is the real guarantee; this is the
// UX safety net. fetch is stubbed — no backend needed.

function stubFetch(impl) {
  const prev = globalThis.fetch
  globalThis.fetch = impl
  return () => { globalThis.fetch = prev }
}

describe('checkout double-submit guard', () => {
  beforeEach(() => __resetSessionGuard())

  it('blocks a second session request while one is in flight', async () => {
    let calls = 0
    const restore = stubFetch(async () => {
      calls += 1
      await new Promise((r) => setTimeout(r, 50))
      return { ok: true, json: async () => ({ url: 'https://checkout.stripe.test/s/1', orderId: 'GV-X' }) }
    })
    try {
      const payload = {
        items: [{ variantId: 'stormlands-standard', qty: 1 }],
        contact: { firstName: 'T', lastName: 'U', email: 't@x.co', country: 'SG' },
      }
      const [a, b] = await Promise.allSettled([createOneTimeSession(payload), createOneTimeSession(payload)])
      assert.equal(a.status, 'fulfilled')
      assert.equal(b.status, 'rejected')
      assert.match(b.reason.message, /already starting/i)
      assert.equal(calls, 1)
    } finally {
      restore()
    }
  })

  it('allows a new request after the previous one settles', async () => {
    let calls = 0
    const restore = stubFetch(async () => {
      calls += 1
      return { ok: true, json: async () => ({ url: 'https://checkout.stripe.test/s/1', orderId: 'GV-X' }) }
    })
    try {
      const payload = {
        items: [{ variantId: 'stormlands-standard', qty: 1 }],
        contact: { firstName: 'T', lastName: 'U', email: 't@x.co', country: 'SG' },
      }
      await createOneTimeSession(payload)
      await createOneTimeSession(payload)
      assert.equal(calls, 2)
    } finally {
      restore()
    }
  })
})
