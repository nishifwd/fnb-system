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
  const [serviceChargeRate, setServiceChargeRate] = useState(profile?.service_charge_rate ?? '0')
  const [taxRate, setTaxRate] = useState(profile?.tax_rate ?? '0')
  const [qrFile, setQrFile] = useState<File | null>(null)
  const [qrVersion, setQrVersion] = useState(0)
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
        service_charge_rate: serviceChargeRate,
        tax_rate: taxRate,
      })
      await onChanged()
      setMessage('Business details saved.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save business details.')
    } finally {
      setSaving(false)
    }
  }

  async function uploadQr(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!qrFile) return
    const form = event.currentTarget
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.uploadPaymentQr(qrFile)
      await onChanged()
      setQrVersion(Date.now())
      setQrFile(null)
      form.reset()
      setMessage('Payment QR image saved.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not upload payment QR image.')
    } finally { setSaving(false) }
  }

  async function removeQr() {
    setSaving(true)
    setError('')
    try {
      await api.removePaymentQr()
      await onChanged()
      setMessage('Payment QR image removed.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not remove payment QR image.')
    } finally { setSaving(false) }
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
          <label className="field">Service charge (%)
            <input type="number" min="0" max="100" step="0.01" value={serviceChargeRate} onChange={(event) => setServiceChargeRate(event.target.value)} required />
          </label>
          <label className="field">Tax (%)
            <input type="number" min="0" max="100" step="0.01" value={taxRate} onChange={(event) => setTaxRate(event.target.value)} required />
          </label>
          <p className="field-wide billing-hint">Both rates start at 0%. Tax is calculated after the discount and service charge. Set rates that apply to your business.</p>
        </div>
        <div className="form-actions">
          <Button type="submit" isDisabled={saving}>{saving ? 'Saving…' : 'Save details'}</Button>
          {message && <span className="success-message" role="status">{message}</span>}
          {error && <span className="error-message" role="alert">{error}</span>}
        </div>
      </form>
      <section className="panel form-panel payment-qr-settings">
        <div className="panel-heading"><h2>Counter payment QR</h2></div>
        <p>Upload the official QR image issued by your bank or payment provider. Staff will display it beside the bill and confirm payment in the provider app.</p>
        {!profile && <p>Save your business details before uploading a payment QR.</p>}
        {profile?.has_payment_qr && <img src={`/api/v1/business/payment-qr?v=${qrVersion}`} alt="Business payment QR code" />}
        <form onSubmit={(event) => void uploadQr(event)}>
          <label className="field">QR image (PNG, JPG, or WebP; up to 2 MB)
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setQrFile(event.target.files?.[0] ?? null)} required />
          </label>
          <div className="form-actions"><Button type="submit" isDisabled={saving || !qrFile || !profile}>Upload QR</Button>{profile?.has_payment_qr && <Button type="button" variant="secondary" isDisabled={saving} onPress={() => void removeQr()}>Remove QR</Button>}</div>
        </form>
      </section>
    </div>
  )
}
