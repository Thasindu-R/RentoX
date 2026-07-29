import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { customerApi, parseError } from '../../api.js'
import FormField, { Alert } from '../../components/FormField.jsx'

const EMPTY = {
  fullName: '', nic: '', drivingLicenceNo: '',
  email: '', phone: '', address: '', registeredDate: '',
}

export default function CustomerForm() {
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
    customerApi.get(id)
      .then((data) => setForm({ ...EMPTY, ...data }))
      .catch((err) => setError(parseError(err).message))
      .finally(() => setLoading(false))
  }, [id])

  const change = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    // Clear the message for this field as soon as the user edits it.
    setFieldErrors((fe) => (fe[name] ? { ...fe, [name]: undefined } : fe))
  }

  const submit = (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})

    const payload = { ...form }
    if (!payload.registeredDate) delete payload.registeredDate

    const request = editing ? customerApi.update(id, payload) : customerApi.create(payload)
    request
      .then(() => navigate('/customers'))
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
          <h1>{editing ? 'Edit Customer' : 'New Customer'}</h1>
          <p>{editing ? 'Update this customer’s details.' : 'Register a customer who will rent vehicles.'}</p>
        </div>
      </div>

      <Alert kind="error" onClose={() => setError('')}>{error}</Alert>

      <form className="card" onSubmit={submit}>
        <div className="card-body">
          <div className="form-grid">
            <FormField label="Full Name" name="fullName" value={form.fullName} onChange={change}
                       required error={fieldErrors.fullName} placeholder="Nimal Perera" full />
            <FormField label="NIC" name="nic" value={form.nic} onChange={change}
                       required error={fieldErrors.nic} placeholder="200012345678"
                       hint="Must be unique across all customers" />
            <FormField label="Driving Licence No" name="drivingLicenceNo" value={form.drivingLicenceNo}
                       onChange={change} required error={fieldErrors.drivingLicenceNo} placeholder="B1234567" />
            <FormField label="Phone" name="phone" value={form.phone} onChange={change}
                       required error={fieldErrors.phone} placeholder="0771234567" />
            <FormField label="Email" name="email" type="email" value={form.email} onChange={change}
                       error={fieldErrors.email} placeholder="nimal@example.com" />
            <FormField label="Address" name="address" as="textarea" value={form.address} onChange={change}
                       error={fieldErrors.address} placeholder="123 Galle Road, Colombo" full />
            {editing && (
              <FormField label="Registered Date" name="registeredDate" type="date"
                         value={form.registeredDate} onChange={change} error={fieldErrors.registeredDate} />
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/customers')} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}
