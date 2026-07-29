import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  categoryApi, FUEL_TYPES, parseError, TRANSMISSIONS, vehicleApi, VEHICLE_STATUSES,
} from '../../api.js'
import FormField, { Alert } from '../../components/FormField.jsx'

const EMPTY = {
  registrationNumber: '', brand: '', model: '', year: '',
  fuelType: '', transmission: '', categoryId: '', status: 'AVAILABLE',
}

export default function VehicleForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [categories, setCategories] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const jobs = [categoryApi.list().then(setCategories)]

    if (editing) {
      // The API returns a nested category object; the form works with the id.
      jobs.push(
        vehicleApi.get(id).then((v) =>
          setForm({
            registrationNumber: v.registrationNumber ?? '',
            brand: v.brand ?? '',
            model: v.model ?? '',
            year: v.year ?? '',
            fuelType: v.fuelType ?? '',
            transmission: v.transmission ?? '',
            categoryId: v.category?.categoryId ?? '',
            status: v.status ?? 'AVAILABLE',
          })
        )
      )
    }

    Promise.all(jobs)
      .catch((err) => setError(parseError(err).message))
      .finally(() => setLoading(false))
  }, [id])

  const change = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setFieldErrors((fe) => (fe[name] ? { ...fe, [name]: undefined } : fe))
  }

  const submit = (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})

    const payload = {
      ...form,
      year: form.year === '' ? null : Number(form.year),
      categoryId: form.categoryId === '' ? null : Number(form.categoryId),
      fuelType: form.fuelType || null,
      transmission: form.transmission || null,
    }

    const request = editing ? vehicleApi.update(id, payload) : vehicleApi.create(payload)
    request
      .then(() => navigate('/vehicles'))
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
          <h1>{editing ? 'Edit Vehicle' : 'New Vehicle'}</h1>
          <p>Vehicles inherit their daily rate from the category you choose.</p>
        </div>
      </div>

      <Alert kind="error" onClose={() => setError('')}>{error}</Alert>

      {categories.length === 0 && (
        <Alert kind="info">
          There are no categories yet. Add a category first — a vehicle must belong to one.
        </Alert>
      )}

      <form className="card" onSubmit={submit}>
        <div className="card-body">
          <div className="form-grid">
            <FormField label="Registration Number" name="registrationNumber" value={form.registrationNumber}
                       onChange={change} required error={fieldErrors.registrationNumber}
                       placeholder="CAB-1234" hint="Must be unique across the fleet" />
            <FormField label="Category" name="categoryId" as="select" value={form.categoryId} onChange={change}
                       required error={fieldErrors.categoryId}
                       options={categories.map((c) => ({ value: c.categoryId, label: `${c.categoryName} — Rs. ${c.dailyRate}/day` }))} />
            <FormField label="Brand" name="brand" value={form.brand} onChange={change}
                       required error={fieldErrors.brand} placeholder="Toyota" />
            <FormField label="Model" name="model" value={form.model} onChange={change}
                       required error={fieldErrors.model} placeholder="Axio" />
            <FormField label="Year" name="year" type="number" min="1950" max="2100" value={form.year}
                       onChange={change} error={fieldErrors.year} placeholder="2019" />
            <FormField label="Status" name="status" as="select" value={form.status} onChange={change}
                       error={fieldErrors.status} options={VEHICLE_STATUSES} />
            <FormField label="Fuel Type" name="fuelType" as="select" value={form.fuelType} onChange={change}
                       error={fieldErrors.fuelType} options={FUEL_TYPES} />
            <FormField label="Transmission" name="transmission" as="select" value={form.transmission}
                       onChange={change} error={fieldErrors.transmission} options={TRANSMISSIONS} />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/vehicles')} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || categories.length === 0}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Vehicle'}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}
