export default function handler(req, res) {
  const { promoCode = '', items = [] } = req.body || {}
  const clean = String(promoCode).trim().toUpperCase()
  if (clean === 'GAMER10') {
    res.status(200).json({
      ok: true,
      discountCents: 1000,
      promoCode: 'GAMER10',
      message: 'GAMER10 applied — S$10.00 off.',
    })
  } else {
    res.status(200).json({
      ok: false,
      message: 'Invalid promo code.',
    })
  }
}
