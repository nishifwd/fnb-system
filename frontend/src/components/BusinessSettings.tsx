import { useState, type FormEvent } from 'react'
import { Button } from '@heroui/react'
import { api, type BusinessProfile } from '../api'

type Props = {
  profile: BusinessProfile | null
  onChanged: () => Promise<void>
}

export function BusinessSettings({ profile, onChanged }: Props) {
  const [name, setName] = useState(profile?.name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [address, setAddress] = useState(profile?.address ?? '')
  const [currency, setCurrency] = useState(profile?.currency ?? 'MYR')
  const [serviceMode, setServiceMode] = useState<BusinessProfile['service_mode']>(profile?.service_mode ?? 'both')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await api.saveBusiness({
        name: name.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        currency: currency.trim().toUpperCase(),
        service_mode: serviceMode,
      })
      await onChanged()
      setMessage('Business details saved.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save business details.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="section-stack">
      <div className="section-heading">
        <div><p className="eyebrow">WORKSPACE SETTINGS</p><h1>Business details</h1></div>
        <p>Set the identity used across the restaurant workspace.</p>
      </div>
      <form className="panel form-panel" onSubmit={(event) => void handleSubmit(event)}>
        <div className="form-grid">
          <label className="field field-wide">Business name
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={255} required placeholder="Your café or restaurant" />
          </label>
          <label className="field">Phone number
            <input value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={50} placeholder="Optional" />
          </label>
          <label className="field">Currency code
            <input value={currency} onChange={(event) => setCurrency(event.target.value)} maxLength={3} minLength={3} required placeholder="MYR" />
          </label>
          <label className="field field-wide">Address
            <textarea value={address} onChange={(event) => setAddress(event.target.value)} rows={4} maxLength={2000} placeholder="Optional business address" />
          </label>
          <label className="field field-wide">Order types
            <select value={serviceMode} onChange={(event) => setServiceMode(event.target.value as BusinessProfile['service_mode'])}>
              <option value="both">Dine-in and takeaway</option>
              <option value="dine_in">Dine-in only</option>
              <option value="takeaway">Takeaway only</option>
            </select>
          </label>
        </div>
        <div className="form-actions">
          <Button type="submit" isDisabled={saving}>{saving ? 'Saving…' : 'Save details'}</Button>
          {message && <span className="success-message" role="status">{message}</span>}
          {error && <span className="error-message" role="alert">{error}</span>}
        </div>
      </form>
    </div>
  )
}
