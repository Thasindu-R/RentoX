import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { authApi, parseError } from '../../api.js'
import FormField, { Alert } from '../../components/FormField.jsx'

const EMPTY = { fullName: '', email: '', password: '', confirm: '', phone: '', address: '' }

/**
 * Public sign-up. This is the ONLY way a customer record is created - staff
 * cannot add customers.
 *
 * Note what is not asked for: NIC and driving licence. Those are collected on
 * the rent form, the first time the customer actually books a vehicle.
 */
export default function Signup({ onLogin, customer }) {
  const [form, setForm] = useState(EMPTY)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Set by Browse when someone clicks "Rent it!" while signed out, so we
  // can drop them back on that vehicle once the account exists.
  const redirectTo = location.state?.redirectTo || '/'

  if (customer) return <Navigate to={redirectTo} replace />

  const change = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setFieldErrors((fe) => (fe[name] ? { ...fe, [name]: undefined } : fe))
  }

  const submit = (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setFieldErrors({ confirm: 'Passwords do not match' })
      return
    }
    setSaving(true)
    setError('')
    setFieldErrors({})

    const { confirm, ...payload } = form
    authApi.signup(payload)
      .then((created) => {
        onLogin(created)
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
        <h1>Create your account</h1>
        <p className="auth-sub">
          {location.state?.redirectTo
            ? 'You need an account to rent a vehicle. It only takes a moment.'
            : 'Sign up to book vehicles and track your rentals.'}
        </p>

        <Alert kind="error" onClose={() => setError('')}>{error}</Alert>

        <form onSubmit={submit}>
          <div className="form-grid">
            <FormField label="Full Name" name="fullName" value={form.fullName} onChange={change}
                       required error={fieldErrors.fullName} placeholder="Kavinda Gayan" full />
            <FormField label="Email" name="email" type="email" value={form.email} onChange={change}
                       required error={fieldErrors.email} placeholder="example@gmail.com" />
            <FormField label="Phone" name="phone" value={form.phone} onChange={change}
                       required error={fieldErrors.phone} placeholder="07xxxxxxxx" />
            <FormField label="Password" name="password" type="password" value={form.password}
                       onChange={change} required error={fieldErrors.password}
                       placeholder="At least 6 characters" />
            <FormField label="Confirm Password" name="confirm" type="password" value={form.confirm}
                       onChange={change} required error={fieldErrors.confirm} placeholder="******" />
            <FormField label="Address" name="address" as="textarea" value={form.address}
                       onChange={change} error={fieldErrors.address}
                       placeholder="123 Galle Road, Colombo" full />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 6 }}
                  disabled={saving}>
            {saving ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-foot">
          Already have an account? <Link to="/login" state={location.state}>Sign in</Link>
        </div>
        <div className="field-hint" style={{ textAlign: 'center', marginTop: 10 }}>
          Enjoy your ride! Your personal information is safe with us.
        </div>
      </div>
    </div>
  )
}
