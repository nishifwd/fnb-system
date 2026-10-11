import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@heroui/react'
import { api, type StaffInput, type StaffUser } from '../api'

export function StaffManager() {
  const [staff, setStaff] = useState<StaffUser[]>([])
  const [form, setForm] = useState<StaffInput>({ name: '', email: '', role: 'waiter', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    void api.staff().then(setStaff).catch((caught) => setError(caught instanceof Error ? caught.message : 'Could not load staff.'))
  }, [])

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const created = await api.createStaff(form)
      setStaff((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)))
      setForm({ name: '', email: '', role: 'waiter', password: '' })
      setMessage(`${created.name} can now sign in.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not add staff.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(user: StaffUser) {
    if (!window.confirm(`Remove ${user.name}'s access?`)) return
    setBusy(true)
    setError('')
    try {
      await api.deleteStaff(user.id)
      setStaff((current) => current.filter((member) => member.id !== user.id))
      setMessage(`${user.name} was removed.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not remove staff.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="section-stack">
      <div className="section-heading"><div><p className="eyebrow">OWNER SETTINGS</p><h1>Staff access</h1></div><p>Add teammates and choose their role.</p></div>
      <form className="panel form-panel" onSubmit={(event) => void create(event)}>
        <h2>Add staff member</h2>
        <div className="form-grid staff-form">
          <label className="field">Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={255} /></label>
          <label className="field">Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required maxLength={255} /></label>
          <label className="field">Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as StaffInput['role'] })}><option value="manager">Manager</option><option value="waiter">Waiter</option><option value="kitchen">Kitchen</option></select></label>
          <label className="field">Temporary password<input type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength={12} required /></label>
        </div>
        <div className="form-actions"><Button type="submit" isDisabled={busy}>{busy ? 'Saving…' : 'Add staff'}</Button>{error && <span className="error-message" role="alert">{error}</span>}{message && <span className="success-message" role="status">{message}</span>}</div>
      </form>
      <div className="panel"><h2>Team</h2><div className="list-stack staff-list">{staff.map((user) => <div className="list-row" key={user.id}><div><strong>{user.name}</strong><small>{user.email} · {user.role}</small></div>{user.role !== 'owner' && <Button variant="secondary" isDisabled={busy} onPress={() => void remove(user)}>Remove</Button>}</div>)}</div></div>
    </div>
  )
}
