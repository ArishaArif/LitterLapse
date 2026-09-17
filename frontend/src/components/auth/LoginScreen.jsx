import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { login, getSession } from '../../lib/auth'
import './LoginScreen.css'

const EMAIL_MAX_LENGTH = 120
const PASSWORD_MAX_LENGTH = 128

function errorText(error) {
  if (error === 'network') return 'Cannot reach the sign-in service. Check that the backend is running.'
  if (error === 401 || error === 403) return 'Invalid email or password.'
  if (error === 'role') return 'Signed in, but this account role cannot access the console.'
  if (error === 'malformed') return 'The sign-in service returned an unexpected response.'
  return `Sign-in failed (HTTP ${error}).`
}

function LoginScreen() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (getSession()) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (busy) return
    const trimmedEmail = email.trim().slice(0, EMAIL_MAX_LENGTH)
    const trimmedPassword = password.slice(0, PASSWORD_MAX_LENGTH)
    if (!trimmedEmail || !trimmedPassword) {
      setError('Enter both email and password.')
      return
    }
    setBusy(true)
    setError(null)
    const result = await login(trimmedEmail, trimmedPassword)
    setBusy(false)
    if (result.ok) {
      navigate('/', { replace: true })
      return
    }
    setError(errorText(result.error))
  }

  return (
    <div className="login-screen">
      <form className="login-screen__panel" onSubmit={handleSubmit} noValidate>
        <div className="login-screen__brand">
          <img className="login-screen__logo" src="/logo.png" alt="" aria-hidden="true" />
          <span className="login-screen__wordmark">LITTER LAPSE</span>
          <span className="login-screen__badge">
            <span className="login-screen__badge-dot" aria-hidden="true" />
            Operator Access
          </span>
        </div>

        <label className="login-screen__field">
          <span className="login-screen__label">Email</span>
          <input
            className="login-screen__input"
            type="email"
            value={email}
            maxLength={EMAIL_MAX_LENGTH}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="login-screen__field">
          <span className="login-screen__label">Password</span>
          <input
            className="login-screen__input"
            type="password"
            value={password}
            maxLength={PASSWORD_MAX_LENGTH}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error ? (
          <p className="login-screen__error" role="alert">
            {error}
          </p>
        ) : null}

        <button className="login-screen__submit" type="submit" disabled={busy}>
          {busy ? 'Signing In…' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}

export default LoginScreen
