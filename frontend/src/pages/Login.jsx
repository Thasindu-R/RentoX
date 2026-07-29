import { useState } from 'react'
import FormField, { Alert } from '../components/FormField.jsx'

/**
 * Single hardcoded staff account, as the proposal specifies.
 * There is no /api/login on the backend - this check happens in the browser.
 */
const STAFF_USERNAME = 'admin'
const STAFF_PASSWORD = 'admin123'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (username.trim() === STAFF_USERNAME && password === STAFF_PASSWORD) {
      setError('')
      onLogin(username.trim())
    } else {
      setError('Incorrect username or password.')
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <div className="brand-mark">R</div>
          <div>
            <div className="login-title">RentoX</div>
            <div className="login-sub">Vehicle Rental Management</div>
          </div>
        </div>

        <Alert kind="error" onClose={() => setError('')}>
          {error}
        </Alert>

        <FormField
          label="Username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="admin"
          autoFocus
          required
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}>
          Sign in
        </button>

        <div className="login-hint">
          Staff login — <strong>admin</strong> / <strong>admin123</strong>
        </div>
      </form>
    </div>
  )
}
