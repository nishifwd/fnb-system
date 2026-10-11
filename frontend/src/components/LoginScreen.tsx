import { useState, type FormEvent } from 'react'
import { Button } from '@heroui/react'
import { api, type StaffUser } from '../api'

export function LoginScreen({ onLogin }: { onLogin: (user: StaffUser) => Promise<void> }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const user = await api.login(email, password)
      await onLogin(user)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not sign in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <form className="panel login-card" onSubmit={(event) => void submit(event)}>
        <div className="brand-mark">F&B</div>
        <p className="eyebrow">STAFF ACCESS</p>
        <h1>Welcome back</h1>
        <p>Sign in to your restaurant workspace.</p>
        <label className="field">Email
          <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="field">Password
          <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <Button type="submit" isDisabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
        {error && <span className="error-message" role="alert">{error}</span>}
      </form>
    </div>
  )
}
