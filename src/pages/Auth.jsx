import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { Breadcrumbs, Field } from '../components/ui/controls.jsx'
import { UserRound, KeyRound } from 'lucide-react'
import { ApiError } from '../services/api.js'

function nextOf(search) {
  const next = new URLSearchParams(search).get('next')
  return next && next.startsWith('/') ? next : '/account'
}

export function Login() {
  const { login } = useSession()
  const { notify } = useToast()
  const nav = useNavigate()
  const loc = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState({})
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const er = {}
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) er.email = 'Enter a valid email.'
    if (!password) er.password = 'Enter your password.'
    setErr(er)
    if (Object.keys(er).length) return
    setBusy(true)
    try {
      await login(email.trim(), password)
      notify('Welcome back!', 'success')
      nav(nextOf(loc.search), { replace: true })
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Login failed. Is the backend running?', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="customer-page auth-page">
      <Breadcrumbs trail={[{ label: 'Home', to: '/' }, { label: 'Log In' }]} />
      <div className="card auth-card">
        <div className="auth-icon"><KeyRound size={27} aria-hidden /></div>
        <h1>Welcome back</h1>
        <p className="text-sm text-[var(--color-muted)]">Sign in to view your orders, saved products and digital keys.</p>
        <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
          <Field label="Email" error={err.email} htmlFor="li-email"><input id="li-email" type="email" className="input" aria-invalid={!!err.email} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>
          <Field label="Password" error={err.password} htmlFor="li-pass"><input id="li-pass" type="password" className="input" aria-invalid={!!err.password} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></Field>
          <button className="btn-primary w-full py-3 text-sm" disabled={busy}>{busy ? 'Logging in…' : 'Log In'}</button>
        </form>
        <p className="mt-3 text-center text-sm text-[var(--color-muted)]">No account? <Link to={`/register${loc.search}`} className="font-semibold text-[var(--color-primary)] hover:underline">Sign up</Link></p>
      </div>
    </div>
  )
}

export function Register() {
  const { register } = useSession()
  const { notify } = useToast()
  const nav = useNavigate()
  const loc = useLocation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState({})
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const er = {}
    if (name.trim().length < 2) er.name = 'Enter your display name.'
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) er.email = 'Enter a valid email.'
    if (password.length < 8) er.password = 'At least 8 characters.'
    setErr(er)
    if (Object.keys(er).length) return
    setBusy(true)
    try {
      await register({ name: name.trim(), email: email.trim(), password, country: 'Singapore' })
      notify('Account created — you are logged in.', 'success')
      nav(nextOf(loc.search), { replace: true })
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Registration failed. Is the backend running?', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="customer-page auth-page">
      <Breadcrumbs trail={[{ label: 'Home', to: '/' }, { label: 'Sign Up' }]} />
      <div className="card auth-card">
        <div className="auth-icon"><UserRound size={27} aria-hidden /></div>
        <h1>Create your account</h1>
        <p className="text-sm text-[var(--color-muted)]">Keep your orders, favourite products and digital keys together.</p>
        <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
          <Field label="Display name" error={err.name} htmlFor="rg-name"><input id="rg-name" className="input" aria-invalid={!!err.name} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></Field>
          <Field label="Email" error={err.email} htmlFor="rg-email"><input id="rg-email" type="email" className="input" aria-invalid={!!err.email} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>
          <Field label="Password" error={err.password} htmlFor="rg-pass"><input id="rg-pass" type="password" className="input" aria-invalid={!!err.password} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></Field>
          <button className="btn-primary w-full py-3 text-sm" disabled={busy}>{busy ? 'Creating…' : 'Sign Up'}</button>
        </form>
        <p className="mt-3 text-center text-sm text-[var(--color-muted)]">Have an account? <Link to={`/login${loc.search}`} className="font-semibold text-[var(--color-primary)] hover:underline">Log in</Link></p>
      </div>
    </div>
  )
}
