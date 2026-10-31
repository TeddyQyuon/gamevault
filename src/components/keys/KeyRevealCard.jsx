import { useRef, useState } from 'react'
import { Copy, Check, ExternalLink, Eye, ShieldAlert, Key, Lock } from 'lucide-react'
import { revealOrderKey } from '../../services/orderService.js'
import { useToast } from '../../context/ToastContext.jsx'
import useFocusTrap from '../../hooks/useFocusTrap.js'

export function getLauncherLink(platform = '', code = '') {
  const p = (platform || '').toLowerCase()
  if (p.includes('steam')) {
    return {
      label: 'Redeem on Steam',
      url: code ? `https://store.steampowered.com/account/registerkey?key=${encodeURIComponent(code)}` : 'steam://open/activateproduct',
    }
  }
  if (p.includes('epic')) {
    return { label: 'Redeem on Epic Games', url: 'https://store.epicgames.com/redeem' }
  }
  if (p.includes('xbox') || p.includes('microsoft')) {
    return { label: 'Redeem on Microsoft / Xbox', url: 'https://redeem.microsoft.com' }
  }
  if (p.includes('playstation') || p.includes('psn') || p.includes('ps4') || p.includes('ps5')) {
    return { label: 'Redeem on PlayStation', url: 'https://store.playstation.com' }
  }
  if (p.includes('nintendo') || p.includes('switch') || p.includes('eshop')) {
    return { label: 'Redeem on Nintendo eShop', url: 'https://ec.nintendo.com/redeem' }
  }
  return { label: 'Redeem on Steam', url: 'steam://open/activateproduct' }
}

export function KeyRevealCard({ orderId, itemId, allocation, productTitle, platform, sessionId, onRevealed }) {
  const { notify } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [currentAlloc, setCurrentAlloc] = useState(allocation)
  const modalRef = useRef(null)
  useFocusTrap({ open: modalOpen, onClose: () => { if (!busy) setModalOpen(false) }, ref: modalRef })

  const isRevealed = Boolean(currentAlloc.isRevealed && currentAlloc.code)
  const displayCode = isRevealed ? currentAlloc.code : (currentAlloc.codeMasked || '•••••-•••••-•••••')
  const launcher = getLauncherLink(platform, currentAlloc.code)

  const handleCopy = async () => {
    if (!isRevealed) return
    try {
      await navigator.clipboard.writeText(currentAlloc.code)
      setCopied(true)
      notify('Activation key copied to clipboard!', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      notify('Failed to copy to clipboard', 'error')
    }
  }

  const handleReveal = async () => {
    if (!agreed) {
      notify('Please confirm the statutory right of withdrawal waiver to reveal the key.', 'warning')
      return
    }
    setBusy(true)
    try {
      const res = await revealOrderKey({
        orderId,
        itemId,
        allocationId: currentAlloc.id,
        sessionId,
      })
      if (res.ok) {
        const updated = {
          ...currentAlloc,
          code: res.code,
          isRevealed: true,
          revealedAt: res.revealedAt,
        }
        setCurrentAlloc(updated)
        setModalOpen(false)
        notify('Key revealed successfully!', 'success')
        if (onRevealed) onRevealed(updated)
      } else {
        notify('Failed to reveal key. Please try again.', 'error')
      }
    } catch (err) {
      notify(err.message || 'Error revealing key', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">{productTitle}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <code className="key-reveal-code select-all rounded-lg bg-[var(--color-elevated)] px-3 py-1.5 font-mono text-sm font-semibold tracking-wider text-[var(--color-text)] border border-[var(--color-border)]">
              {displayCode}
            </code>
            {!isRevealed ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-warning-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-warning)]">
                <Lock size={12} /> Masked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-success-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-success)]">
                <Key size={12} /> Revealed
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isRevealed ? (
            <button
              onClick={() => { setAgreed(false); setModalOpen(true) }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] min-h-[44px] px-3.5 py-2 text-xs font-bold text-[var(--color-on-primary)] shadow-md hover:bg-[var(--color-primary-hover)] transition-all"
            >
              <Eye size={14} /> Display Key
            </button>
          ) : (
            <>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] min-h-[44px] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors"
                title="Copy Key"
              >
                {copied ? <Check size={14} className="text-[var(--color-success)]" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <a
                href={launcher.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-primary-soft)] min-h-[44px] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] transition-colors"
              >
                <ExternalLink size={14} /> {launcher.label}
              </a>
            </>
          )}
        </div>
      </div>

      {isRevealed && currentAlloc.revealedAt && (
        <p className="mt-2 text-[11px] text-[var(--color-muted)]">
          Decrypted & logged on {new Date(currentAlloc.revealedAt).toLocaleString()} (Audit ID: #{currentAlloc.id})
        </p>
      )}

      {/* Statutory Waiver Modal (EU Directive 2011/83/EU Art. 16(m)) */}
      {modalOpen && (
        <div className="key-reveal-modal" role="dialog" aria-modal="true" aria-labelledby="key-reveal-title">
          <div className="key-reveal-dialog" ref={modalRef} tabIndex={-1}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-warning-soft)] text-[var(--color-warning)]">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 id="key-reveal-title" className="text-lg font-bold text-[var(--color-text)]">Statutory Right of Withdrawal Waiver</h3>
                <p className="mt-1 text-xs text-[var(--color-muted)]">EU Directive 2011/83/EU Art. 16(m) & Digital Product Terms</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-elevated)] p-4 text-xs leading-relaxed text-[var(--color-muted)]">
              <p className="font-semibold text-[var(--color-text)] mb-2">Important Notice on Key Revelation:</p>
              <p>
                By clicking <strong>“Confirm & Reveal Key”</strong>, you expressly request immediate performance of this digital contract and acknowledge that you lose your statutory 14-day right of withdrawal and refund once the activation key has been displayed.
              </p>
              <p className="mt-2 text-[var(--color-warning)]">
                A permanent audit record of this revelation (including timestamp, IP address, and browser signature) will be created for dispute prevention.
              </p>
            </div>

            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--color-border)] p-3 hover:bg-[var(--color-elevated)] transition-colors">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-[var(--color-primary)]"
              />
              <span className="text-xs font-medium text-[var(--color-text)]">
                I understand and expressly agree to immediate execution and waive my statutory 14-day right of withdrawal for this key.
              </span>
            </label>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={busy}
                className="rounded-lg border border-[var(--color-border)] min-h-[44px] px-4 py-2 text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-elevated)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReveal}
                disabled={!agreed || busy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] min-h-[44px] px-4 py-2 text-xs font-bold text-[var(--color-on-primary)] shadow-md hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-all"
              >
                {busy ? 'Decrypting…' : 'Confirm & Reveal Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
