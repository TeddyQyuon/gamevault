import { Link } from 'react-router-dom'

// One coherent button system: primary (electric blue), secondary (outline), ghost.
export function Button({ to, href, variant = 'primary', className = '', ...rest }) {
  const base = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-[10px] min-h-[44px] transition'
  const styles = {
    primary: 'btn-primary',
    secondary: 'border border-[var(--color-border)] bg-[var(--color-elevated)] text-[var(--color-text)] hover:border-[var(--color-cyan)]',
    ghost: 'text-[var(--color-muted)] hover:text-[var(--color-text)]',
    gradient: 'text-white bg-gradient-to-r from-[#2855FF] to-[#8B5CF6] hover:opacity-95',
  }[variant]
  const cls = `${base} ${styles} ${className}`
  if (to) return <Link to={to} className={cls} {...rest} />
  if (href) return <a href={href} className={cls} {...rest} />
  return <button className={cls} {...rest} />
}

export function Field({ label, error, children, htmlFor }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
        {label}
      </label>
      {children}
      {error && <p role="alert" className="mt-1 text-xs text-[#fb7185]">{error}</p>}
    </div>
  )
}

export function Badge({ children, tone = 'info' }) {
  const tones = {
    info: 'bg-[#2855FF]/20 text-[#9db4ff] border-[#2855FF]/40',
    deal: 'bg-[#fb7185]/15 text-[#b91c1c] border-[#fb7185]/40',
    success: 'bg-[#10D9A0]/15 text-[#15803d] border-[#10D9A0]/40',
    warning: 'bg-[#fbbf24]/15 text-[#fcd34d] border-[#fbbf24]/40',
    muted: 'bg-white/5 text-[var(--color-muted)] border-[var(--color-border)]',
  }
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>
}

export function Breadcrumbs({ trail }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-[var(--color-muted)]">
      <ol className="flex flex-wrap items-center gap-1.5">
        {trail.map((t, i) => (
          <li key={t.label} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {t.to ? <Link to={t.to} className="hover:text-[var(--color-text)]">{t.label}</Link> : <span aria-current="page" className="text-[var(--color-text)]">{t.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
