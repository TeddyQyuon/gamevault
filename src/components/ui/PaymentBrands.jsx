import './payment-brands.css'

// Original provider files, downloaded from each brand's own website.
// Source URLs and byte hashes are recorded beside the self-hosted assets.
const PAYMENT_BRANDS = [
  { file: 'visa.png', name: 'Visa' },
  { file: 'mastercard.svg', name: 'Mastercard' },
  { file: 'apple-pay.svg', name: 'Apple Pay' },
  { file: 'google-pay.svg', name: 'Google Pay' },
  { file: 'stripe.svg', name: 'Stripe' },
]

export default function PaymentBrands() {
  return (
    <ul className="payment-brands" aria-label="Payment brands">
      {PAYMENT_BRANDS.map(({ file, name }) => (
        <li className="payment-brands__tile" key={file}>
          <img src={`/assets/payment-brands/${file}`} alt={name} width="64" height="40" loading="lazy" decoding="async" />
        </li>
      ))}
    </ul>
  )
}
