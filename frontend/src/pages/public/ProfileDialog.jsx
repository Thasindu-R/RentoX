import { useEffect, useState } from 'react'
import { customerApi, customerImageUrl, parseError } from '../../api.js'
import FormField, { Alert } from '../../components/FormField.jsx'

const FIELDS = ['fullName', 'email', 'phone', 'address', 'nic', 'drivingLicenceNo']

function Detail({ label, children }) {
  return (
    <div>
      <div className="detail-label">{label}</div>
      <div className="detail-value">{children || '—'}</div>
    </div>
  )
}

/**
 * The customer's own account, opened from their name in the header.
 *
 * NIC and licence are optional here on purpose: sign-up does not ask for them
 * and an account can exist without them. They become required at the point
 * they matter, on the rent form, which is also where the server insists on
 * them. So this dialog lets someone fill them in early or correct them later.
 *
 * The photo goes to its own multipart endpoint, so it uploads on selection
 * rather than waiting for Save - the same arrangement as the vehicle form.
 */
export default function ProfileDialog({ customer, onClose, onUpdated }) {
  const [form, setForm] = useState({})
  const [editing, setEditing] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)

  useEffect(() => {
    if (!customer) return
    setForm(Object.fromEntries(FIELDS.map((f) => [f, customer[f] ?? ''])))
    setEditing(false)
    setFieldErrors({})
    setError('')
  }, [customer])

  const change = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setFieldErrors((fe) => (fe[name] ? { ...fe, [name]: undefined } : fe))
  }

  const save = (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})

    // registeredDate and the password hash are left out: the server keeps its
    // own copy of both, and the hash never leaves the API in the first place.
    customerApi.update(customer.customerId, { ...form })
      .then((updated) => {
        onUpdated(updated)
        setEditing(false)
      })
      .catch((err) => {
        const parsed = parseError(err)
        setError(parsed.message)
        setFieldErrors(parsed.fieldErrors)
      })
      .finally(() => setSaving(false))
  }

  const onPickPhoto = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoBusy(true)
    setError('')
    customerApi.uploadPhoto(customer.customerId, file)
      .then(onUpdated)
      .catch((err) => setError(parseError(err).message))
      .finally(() => setPhotoBusy(false))
  }

  const onRemovePhoto = () => {
    setPhotoBusy(true)
    setError('')
    customerApi.removePhoto(customer.customerId)
      .then(onUpdated)
      .catch((err) => setError(parseError(err).message))
      .finally(() => setPhotoBusy(false))
  }

  if (!customer) return null

  const photo = customerImageUrl(customer)
  const busy = saving || photoBusy

  return (
    <div className="modal-backdrop" onClick={busy ? undefined : onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <h3>My account</h3>
        <p>The details we hold for you.</p>

        <Alert kind="error" onClose={() => setError('')}>{error}</Alert>

        <div className="profile-photo-row">
          {photo
            ? <img className="profile-photo" src={photo} alt={customer.fullName} />
            : <div className="profile-photo empty">{(customer.fullName || '?').slice(0, 1).toUpperCase()}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label className="btn btn-secondary btn-sm" style={{ cursor: busy ? 'default' : 'pointer' }}>
              {photoBusy ? 'Uploading…' : photo ? 'Replace photo' : 'Upload photo'}
              <input type="file" accept="image/*" onChange={onPickPhoto}
                     disabled={busy} style={{ display: 'none' }} />
            </label>
            {photo && (
              <button type="button" className="btn-link danger" onClick={onRemovePhoto} disabled={busy}>
                Remove photo
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <form onSubmit={save}>
            <div className="form-grid">
              <FormField label="Full Name" name="fullName" value={form.fullName} onChange={change}
                         required error={fieldErrors.fullName} full />
              <FormField label="Email" name="email" type="email" value={form.email} onChange={change}
                         required error={fieldErrors.email} full
                         hint="This is what you sign in with" />
              <FormField label="Phone" name="phone" value={form.phone} onChange={change}
                         required error={fieldErrors.phone} />
              <FormField label="NIC" name="nic" value={form.nic} onChange={change}
                         error={fieldErrors.nic} placeholder="200012345678"
                         hint="Required to rent a vehicle" />
              <FormField label="Driving Licence No" name="drivingLicenceNo" value={form.drivingLicenceNo}
                         onChange={change} error={fieldErrors.drivingLicenceNo} placeholder="B1234567"
                         hint="Required to rent a vehicle" />
              <FormField label="Address" name="address" as="textarea" value={form.address}
                         onChange={change} error={fieldErrors.address} full />
            </div>

            <div className="modal-actions" style={{ marginTop: 18 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)} disabled={busy}>
                Back
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="detail-grid">
              <Detail label="Full name">{customer.fullName}</Detail>
              <Detail label="Email">{customer.email}</Detail>
              <Detail label="Phone">{customer.phone}</Detail>
              <Detail label="Registered">{customer.registeredDate}</Detail>
              <Detail label="NIC">
                {customer.nic ? <span className="mono">{customer.nic}</span> : null}
              </Detail>
              <Detail label="Driving licence no">
                {customer.drivingLicenceNo ? <span className="mono">{customer.drivingLicenceNo}</span> : null}
              </Detail>
              <Detail label="Address">{customer.address}</Detail>
            </div>

            {(!customer.nic || !customer.drivingLicenceNo) && (
              <div className="field-hint" style={{ marginTop: 14 }}>
                Your NIC and driving licence number are needed to rent a vehicle. You can add
                them here, or on the rent form when you book.
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: 18 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
                Close
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setEditing(true)} disabled={busy}>
                Edit details
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
