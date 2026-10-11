import crypto from 'node:crypto'

// Clearly labelled test codes (TEST- prefix, never mistaken for live stock).
// Only used for fulfilment='demo_test' products in Stripe test mode.

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function rand4() {
  let s = ''
  for (let i = 0; i < 4; i += 1) s += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]
  return s
}

export function generateDemoCode(variantId, index) {
  const tag = variantId.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'GAME'
  return `TEST-${tag}-${rand4()}-${rand4()}-${index + 1}X`
}
