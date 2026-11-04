import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'

test('payment artwork matches the original first-party downloads', () => {
  const dir = new URL('../public/assets/payment-brands/', import.meta.url)
  const sources = JSON.parse(fs.readFileSync(new URL('sources.json', dir), 'utf8'))
  assert.equal(sources.length, 5)
  const officialHosts = new Set(['cdn.visa.com', 'www.mastercard.com', 'developer.apple.com', 'developers.google.com', 'assets.stripeassets.com'])
  for (const { file, source, sha256 } of sources) {
    assert.ok(officialHosts.has(new URL(source).hostname), `${file}: first-party source`)
    const bytes = fs.readFileSync(new URL(file, dir))
    assert.equal(createHash('sha256').update(bytes).digest('hex'), sha256, `${file}: original artwork bytes`)
    if (file.endsWith('.svg')) {
      assert.match(bytes.toString(), /viewBox=/, `${file}: scalable original geometry`)
      assert.doesNotMatch(bytes.toString(), /<text\b/, `${file}: no substitute font wordmark`)
    } else {
      assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    }
  }
})
