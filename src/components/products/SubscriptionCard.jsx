import { Check } from 'lucide-react'
import { formatPrice } from '../../utils/format.js'
import { yearlyMath } from '../../data/subscriptions.js'
import Artwork from '../ui/Artwork.jsx'
import { useCart } from '../../context/CartContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useNavigate } from 'react-router-dom'
import { findVariant } from '../../data/products.js'

// Subscription card: monthly/yearly toggle lives on the page; the card
// receives the active period and adds the matching billing-period variant.
export default function SubscriptionCard({ plan, period, highlight }) {
  const { add } = useCart()
  const { notify } = useToast()
  const nav = useNavigate()
  const ym = yearlyMath(plan)
  const monthly = period === 'monthly'
  const shown = monthly ? plan.monthlyCents : plan.yearlyCents

  // Map plan -> product variant so cart identity stays variant-based.
  const variantId = variantForPlan(plan, period)

  return (
    <article className={`flex flex-col overflow-hidden rounded-[12px] border ${highlight ? 'border-[#8B5CF6] bg-[#141b36]' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}>
      <Artwork artKey={plan.art || plan.id} title={plan.name} ratio="16/8" />
      <div className="flex flex-1 flex-col p-5">
      {plan.badge && <span className="mb-2 w-fit rounded-full bg-[#8B5CF6] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">{plan.badge}</span>}
      <h3 className="text-lg font-extrabold">{plan.name}</h3>
      <p className="text-sm text-[var(--color-muted)]">{plan.blurb}</p>
      <p className="mt-3">
        <span className="text-2xl font-extrabold">{formatPrice(shown)}</span>
        <span className="text-sm text-[var(--color-muted)]"> /{monthly ? 'month' : 'year'}</span>
      </p>
      {!monthly && (
        <p className="text-xs text-[var(--color-muted)]">
          {formatPrice(plan.yearlyCents)} billed yearly · ≈{formatPrice(Math.round(ym.equivalentMonthly))}/mo · Save {ym.pct}%
        </p>
      )}
      {monthly && <p className="text-xs text-[var(--color-muted)]">{formatPrice(plan.monthlyCents * 12)} / year if paid monthly</p>}
      <button
        onClick={() => {
          if (variantId && add(variantId)) {
            notify(`${plan.name} (${period}) added to cart`, 'success')
            nav('/cart')
          } else {
            notify('Could not add that plan (catalogue mismatch)', 'error')
          }
        }}
        className="btn-primary mt-4 w-full px-4 py-2.5 text-sm"
      >
        Choose Plan →
      </button>
      <ul className="mt-4 space-y-1.5 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check size={15} className="mt-0.5 shrink-0 text-[#10D9A0]" aria-hidden />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      </div>
    </article>
  )
}

function variantForPlan(plan, period) {
  // Yearly/monthly variant IDs follow "<slug-ish>-monthly|yearly" in data.
  const suffix = period === 'monthly' ? 'monthly' : 'yearly'
  const candidates = [
    `${plan.id}-${suffix}`,
    `${plan.id.replace(/-/g, '')}-${suffix}`,
  ]
  // Gift-card products use different ids — resolve via slug map:
  const slugMap = {
    'game-pass-ultimate': ['gamepass-1mo', 'gamepass-3mo'],
    netflix: ['netflix-1mo', 'netflix-3mo'],
    'spotify-premium': ['spotify-1mo', 'spotify-3mo'],
  }
  if (slugMap[plan.id]) return slugMap[plan.id][period === 'monthly' ? 0 : 1]
  for (const c of candidates) {
    if (findVariant(c)) return c
  }
  return null
}
