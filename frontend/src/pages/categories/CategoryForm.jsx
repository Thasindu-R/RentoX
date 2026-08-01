import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { categoryApi, parseError } from '../../api.js'
import FormField, { Alert } from '../../components/FormField.jsx'

const EMPTY = { categoryName: '', description: '', dailyRate: '', seatingCapacity: '' }

export default function CategoryForm() {
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
    categoryApi.get(id)
      .then((data) => setForm({ ...EMPTY, ...data }))
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

    // Number fields arrive from inputs as strings - convert before sending so
    // Jackson binds them to BigDecimal / Integer.
    const payload = {
      ...form,
      dailyRate: form.dailyRate === '' ? null : Number(form.dailyRate),
      seatingCapacity: form.seatingCapacity === '' ? null : Number(form.seatingCapacity),
    }

    const request = editing ? categoryApi.update(id, payload) : categoryApi.create(payload)
    request
      .then(() => navigate('/staff/categories'))
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
          <h1>{editing ? 'Edit Category' : 'New Category'}</h1>
          <p>Categories set the daily rate used to price every booking.</p>
        </div>
      </div>

      <Alert kind="error" onClose={() => setError('')}>{error}</Alert>

      <form className="card" onSubmit={submit}>
        <div className="card-body">
          <div className="form-grid">
            <FormField label="Category Name" name="categoryName" value={form.categoryName} onChange={change}
                       required error={fieldErrors.categoryName} placeholder="Car" />
            <FormField label="Seating Capacity" name="seatingCapacity" type="number" min="1"
                       value={form.seatingCapacity} onChange={change} required error={fieldErrors.seatingCapacity}
                       placeholder="5" />
            <FormField label="Daily Rate (Rs.)" name="dailyRate" type="number" step="0.01" min="0"
                       value={form.dailyRate} onChange={change} required error={fieldErrors.dailyRate}
                       placeholder="7500.00" hint="Charged per day for every vehicle in this category" />
            <FormField label="Description" name="description" as="textarea" value={form.description}
                       onChange={change} error={fieldErrors.description}
                       placeholder="Standard 5-seater car" full />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/staff/categories')} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}
