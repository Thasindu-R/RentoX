import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { driverApi, parseError } from '../../api.js'
import FormField, { Alert } from '../../components/FormField.jsx'

const EMPTY = { fullName: '', nic: '', licenceNo: '', phone: '', dailyCharge: '', available: true }

export default function DriverForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!editing) return
    driverApi.get(id)
      .then((data) => setForm({ ...EMPTY, ...data }))
      .catch((err) => setError(parseError(err).message))
      .finally(() => setLoading(false))
  }, [id])

  const change = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    setFieldErrors((fe) => (fe[name] ? { ...fe, [name]: undefined } : fe))
  }

  const submit = (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})

    const payload = {
      ...form,
      dailyCharge: form.dailyCharge === '' ? 0 : Number(form.dailyCharge),
    }

    const request = editing ? driverApi.update(id, payload) : driverApi.create(payload)
    request
      .then(() => navigate('/staff/drivers'))
      .catch((err) => {
        const parsed = parseError(err)
        setError(parsed.message)
        setFieldErrors(parsed.fieldErrors)
      })
      .finally(() => setSaving(false))
  }

  if (loading) {
    return <div className="card"><div className="state"><div className="spinner" /></div></div>
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{editing ? 'Edit Driver' : 'New Driver'}</h1>
          <p>The daily charge is added on top of the vehicle rate when this driver is assigned.</p>
        </div>
      </div>

      <Alert kind="error" onClose={() => setError('')}>{error}</Alert>

      <form className="card" onSubmit={submit}>
        <div className="card-body">
          <div className="form-grid">
            <FormField label="Full Name" name="fullName" value={form.fullName} onChange={change}
                       required error={fieldErrors.fullName} placeholder="Sunil Silva" full />
            <FormField label="NIC" name="nic" value={form.nic} onChange={change}
                       required error={fieldErrors.nic} placeholder="198512345678"
                       hint="Must be unique across all drivers" />
            <FormField label="Licence No" name="licenceNo" value={form.licenceNo} onChange={change}
                       required error={fieldErrors.licenceNo} placeholder="C9876543" />
            <FormField label="Phone" name="phone" value={form.phone} onChange={change}
                       required error={fieldErrors.phone} placeholder="0719876543" />
            <FormField label="Daily Charge (Rs.)" name="dailyCharge" type="number" step="0.01" min="0"
                       value={form.dailyCharge} onChange={change} error={fieldErrors.dailyCharge}
                       placeholder="2500.00" />

            <div className="field full">
              <div className="check">
                <input id="available" name="available" type="checkbox"
                       checked={!!form.available} onChange={change} />
                <label htmlFor="available">Available for new bookings</label>
              </div>
              {fieldErrors.available && <div className="field-error">{fieldErrors.available}</div>}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/staff/drivers')} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Driver'}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}
