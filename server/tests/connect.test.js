import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  assertAllowedCombo,
  feeForDestination,
  transferForSeparate,
  platformFeeForSeparate,
  splitSellerPool,
  isReadyForDestination,
  isReadyForDirect,
  destinationCheckoutParams,
  separateCheckoutParams,
  directCheckoutOptions,
} from '../src/services/connectService.js'

describe('connect combos (blocked paths)', () => {
  it('allows marketplace express/application/application/destination', () => {
    assert.equal(assertAllowedCombo({
      dashboard: 'express', feesCollector: 'application', lossesCollector: 'application', chargePattern: 'destination',
    }), true)
  })

  it('allows SaaS full/stripe/stripe/direct', () => {
    assert.equal(assertAllowedCombo({
      dashboard: 'full', feesCollector: 'stripe', lossesCollector: 'stripe', chargePattern: 'direct',
    }), true)
  })

  it('blocks express + stripe-owned responsibilities', () => {
    try {
      assertAllowedCombo({
        dashboard: 'express', feesCollector: 'stripe', lossesCollector: 'stripe', chargePattern: 'direct',
      })
      assert.fail('should have thrown')
    } catch (err) {
      assert.equal(err.code, 'CONNECT_BLOCKED_COMBO')
    }
  })

  it('blocks stripe losses with destination (must be application)', () => {
    try {
      assertAllowedCombo({
        dashboard: 'express', feesCollector: 'application', lossesCollector: 'stripe', chargePattern: 'destination',
      })
      assert.fail('should have thrown')
    } catch (err) {
      assert.equal(err.code, 'CONNECT_BLOCKED_COMBO')
    }
  })
})

describe('connect fee math', () => {
  it('destination: platform fee + Stripe estimate → seller receives remainder', () => {
    const out = feeForDestination({ totalCents: 10000, platformFeeCents: 1500, stripeFeeEstimateCents: 350 })
    assert.equal(out.applicationFeeAmount, 1850)
    assert.equal(out.sellerReceives, 8150)
  })

  it('destination: rejects fee >= total', () => {
    try {
      feeForDestination({ totalCents: 100, platformFeeCents: 100 })
      assert.fail('should have thrown')
    } catch (err) {
      assert.equal(err.code, 'BAD_FEE')
    }
  })

  it('separate: transfer math, never application_fee_amount', () => {
    const out = transferForSeparate({ totalCents: 25000, sellerAmountsCents: [8000, 12000] })
    assert.equal(out.platformRetains, 5000)
  })

  it('separate: rejects over-allocation', () => {
    try {
      transferForSeparate({ totalCents: 1000, sellerAmountsCents: [600, 500] })
      assert.fail('should have thrown')
    } catch (err) {
      assert.equal(err.code, 'BAD_SPLIT')
    }
  })
})

describe('connect capability gates (v2 paths)', () => {
  it('destination ready only when stripe_transfers active', () => {
    assert.equal(isReadyForDestination({
      configuration: { recipient: { capabilities: { stripe_balance: { stripe_transfers: { status: 'active' } } } } },
    }), true)
    assert.equal(isReadyForDestination({
      configuration: { recipient: { capabilities: { stripe_balance: { stripe_transfers: { status: 'pending' } } } } },
    }), false)
    // Never use v1 charges_enabled/payouts_enabled:
    assert.equal(isReadyForDestination({ charges_enabled: true, payouts_enabled: true }), false)
  })

  it('direct ready only when card_payments active', () => {
    assert.equal(isReadyForDirect({
      configuration: { merchant: { capabilities: { card_payments: { status: 'active' } } } },
    }), true)
    assert.equal(isReadyForDirect({ charges_enabled: true }), false)
  })
})

describe('connect checkout params', () => {
  it('destination session carries transfer_data + application_fee + identifier', () => {
    const p = destinationCheckoutParams({
      orderId: 'GV-1', userId: 'u1',
      lines: [{ productTitle: 'Stormlands', variantLabel: 'Standard', unitCents: 2999, qty: 1 }],
      customerId: 'cus_1', sellerAccountId: 'acct_1', platformFeeCents: 300,
      successUrl: 'https://x/success', cancelUrl: 'https://x/cancel',
    })
    assert.equal(p.payment_intent_data.transfer_data.destination, 'acct_1')
    assert.equal(p.payment_intent_data.application_fee_amount, 300)
    assert.ok(p.integration_identifier.startsWith('gamevault-dest-'))
    assert.ok(!('payment_method_types' in p))
  })

  it('direct uses stripeAccount header, not transfer_data', () => {
    assert.deepEqual(directCheckoutOptions({ sellerAccountId: 'acct_2' }), { stripeAccount: 'acct_2' })
  })

  it('separate (hold): 10% + estimate, no transfer_data, no application_fee', () => {
    const p = separateCheckoutParams({
      orderId: 'GV-2', userId: 'u1',
      lines: [{ productTitle: 'Stormlands', variantLabel: 'Standard', unitCents: 10000, qty: 1 }],
      customerId: 'cus_1', platformFeeCents: 1350,
      successUrl: 'https://x/success', cancelUrl: 'https://x/cancel',
    })
    assert.ok(!('payment_intent_data' in p))
    assert.ok(p.integration_identifier.startsWith('gamevault-sep-'))
    assert.equal(p.metadata.gamevaultChargePattern, 'separate')
  })
})

describe('hold-and-release fee (10% + estimate)', () => {
  it('computes 10% cut + Stripe estimate, seller pool = remainder', () => {
    const out = platformFeeForSeparate({ totalCents: 10000, percentBps: 1000, stripeFeeEstimateCents: 350 })
    assert.equal(out.platformFeeCents, 1350)
    assert.equal(out.sellerPoolCents, 8650)
  })

  it('splits pool across sellers, remainder stays with platform', () => {
    const out = splitSellerPool({
      sellerPoolCents: 8650,
      splits: [{ stripeAccountId: 'acct_A', amountCents: 5000 }, { stripeAccountId: 'acct_B', amountCents: 3650 }],
    })
    assert.equal(out.remainderToPlatform, 0)
  })

  it('rejects over-allocated splits', () => {
    try {
      splitSellerPool({ sellerPoolCents: 1000, splits: [{ stripeAccountId: 'acct_A', amountCents: 800 }, { stripeAccountId: 'acct_B', amountCents: 500 }] })
      assert.fail('should have thrown')
    } catch (err) {
      assert.equal(err.code, 'BAD_SPLIT')
    }
  })
})
