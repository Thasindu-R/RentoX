import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { authApi, parseError } from '../../api.js'
import FormField, { Alert } from '../../components/FormField.jsx'

/** Customer sign-in. Staff sign in separately at /staff/login. */
export default function CustomerLogin({ onLogin, customer }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = location.state?.redirectTo || '/'
  if (customer) return <Navigate to={redirectTo} replace />

  const change = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setFieldErrors((fe) => (fe[name] ? { ...fe, [name]: undefined } : fe))
  }

  const submit = (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})
    authApi.login(form)
      .then((c) => {
        onLogin(c)
        navigate(redirectTo, { replace: true })
      })
      .catch((err) => {
        const parsed = parseError(err)
        setError(parsed.message)
        setFieldErrors(parsed.fieldErrors)
      })
      .finally(() => setSaving(false))
  }

  return (
    <div className="site-content narrow">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="auth-sub">Sign in to book a vehicle or view your rentals.</p>

        <Alert kind="error" onClose={() => setError('')}>{error}</Alert>

        <form onSubmit={submit}>
          <FormField label="Email" name="email" type="email" value={form.email} onChange={change}
                     required error={fieldErrors.email} placeholder="you@example.com" full autoFocus />
          <FormField label="Password" name="password" type="password" value={form.password}
                     onChange={change} required error={fieldErrors.password} placeholder="••••••••" full />
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}
                  disabled={saving}>
            {saving ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-foot">
          New here? <Link to="/signup" state={location.state}>Create an account</Link>
        </div>
      </div>
    </div>
  )
}
