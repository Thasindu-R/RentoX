import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { authApi, parseError } from '../../api.js'
import FormField, { Alert } from '../../components/FormField.jsx'

/**
 * The single sign-in form for the whole app.
 *
 * Customers sign in with the email they signed up with; the backend checks the
 * password against a BCrypt hash. The admin account is the one hardcoded pair
 * from the project scope - there is no /api/login for staff, so it is matched
 * here in the browser and sent on to the staff dashboard instead.
 */
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin123'

export default function CustomerLogin({ onLogin, onStaffLogin, customer, staff }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = location.state?.redirectTo || '/'
  if (staff) return <Navigate to="/staff" replace />
  if (customer) return <Navigate to={redirectTo} replace />

  const change = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setFieldErrors((fe) => (fe[name] ? { ...fe, [name]: undefined } : fe))
  }

  const submit = (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    // The admin pair never reaches the backend - it has no account there.
    const identifier = form.email.trim()
    if (identifier === ADMIN_USERNAME && form.password === ADMIN_PASSWORD) {
      onStaffLogin(identifier)
      navigate('/staff', { replace: true })
      return
    }

    setSaving(true)
    authApi.login({ ...form, email: identifier })
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
          {/* Plain text rather than type="email": the admin account signs in
              with a username, which the browser would reject as invalid. */}
          <FormField label="Email" name="email" type="text" value={form.email} onChange={change}
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
