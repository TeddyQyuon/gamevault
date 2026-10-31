import { cloneElement, isValidElement, useId } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export function Button({ to, href, variant = 'primary', className = '', type = 'button', ...rest }) {
  const style = variant === 'primary' || variant === 'gradient' ? 'btn-primary' : `ui-button--${variant}`
  const classes = `ui-button ${style} ${className}`
  if (to) return <Link to={to} className={classes} {...rest} />
  if (href) return <a href={href} className={classes} {...rest} />
  return <button type={type} className={classes} {...rest} />
}

export function Field({ label, error, children, htmlFor }) {
  const generatedId = useId()
  const id = htmlFor || children?.props?.id || generatedId
  const errorId = `${id}-error`
  const control = isValidElement(children) ? cloneElement(children, {
    id,
    'aria-describedby': [children.props['aria-describedby'], error ? errorId : ''].filter(Boolean).join(' ') || undefined,
    'aria-invalid': error ? true : children.props['aria-invalid'],
  }) : children
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">{label}</label>
      {control}
      {error && <p id={errorId} role="alert" className="field-error">{error}</p>}
    </div>
  )
}

export function Badge({ children, tone = 'info', className = '' }) {
  return <span className={`ui-badge ui-badge--${tone} ${className}`}>{children}</span>
}

export function Breadcrumbs({ trail }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <ol>
        {trail.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {index > 0 && <ChevronRight size={12} aria-hidden="true" />}
            {item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
