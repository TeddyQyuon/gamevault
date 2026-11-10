import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'

test('public Express storefront registers no privileged coder routes, with or without a session cookie', async (t) => {
  let databaseAccess = 0
  const models = new Proxy({}, { get() { databaseAccess++; throw new Error('Coder requests must not touch accounts or privileged services') } })
  const app = createApp({ cfg: { nodeEnv: 'production', clientUrl: 'https://store.example.invalid', cookieSecure: true },
    models, sequelize: {}, stripe: {} })
  const server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const origin = `http://127.0.0.1:${server.address().port}`
  for (const path of ['status', 'test', 'git', 'execute', 'github-dispatch']) {
    for (const cookie of ['', 'gv_session=untrusted-user-session']) {
      const res = await fetch(`${origin}/api/coder/${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ repoKey: '/', customCmd: 'this must never execute', task: 'this must never use provider credentials' }),
      })
      assert.equal(res.status, 404)
      const body = await res.json()
      assert.equal(body.error.code, 'NOT_FOUND')
    }
  }
  assert.equal((await fetch(`${origin}/api/coder/status`)).status, 404)
  assert.equal(databaseAccess, 0)
})
