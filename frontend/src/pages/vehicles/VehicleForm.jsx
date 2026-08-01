import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  categoryApi, FUEL_TYPES, parseError, TRANSMISSIONS, vehicleApi,
  vehicleImageUrl, VEHICLE_STATUSES,
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
  const location = useLocation()

  const [form, setForm] = useState(EMPTY)
  const [categories, setCategories] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [photoBusy, setPhotoBusy] = useState(false)

  // A new vehicle has no id yet, so its photo is held here until it does.
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  /**
   * Carried over when a vehicle was created but its photo failed to upload, so
   * the message survives the redirect onto that vehicle - see submit().
   */
  useEffect(() => {
    if (location.state?.photoError) setError(location.state.photoError)
  }, [location.state])

  useEffect(() => {
    const jobs = [categoryApi.list().then(setCategories)]

    if (editing) {
      // Anything picked on the create form belongs to the vehicle now saved.
      setPhotoFile(null)
      setPhotoPreview(null)
      // The API returns a nested category object; the form works with the id.
      jobs.push(
        vehicleApi.get(id).then((v) => {
          setPhotoUrl(vehicleImageUrl(v))
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
        })
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

  /**
   * Uploads immediately on file selection rather than waiting for Save, because
   * the file goes to a different endpoint (multipart) than the rest of the form.
   */
  const onPickPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoBusy(true)
    setError('')
    vehicleApi.uploadPhoto(id, file)
      .then((v) => setPhotoUrl(vehicleImageUrl(v)))
      .catch((err) => setError(parseError(err).message))
      .finally(() => { setPhotoBusy(false); e.target.value = '' })
  }

  const onRemovePhoto = () => {
    setPhotoBusy(true)
    vehicleApi.removePhoto(id)
      .then(() => setPhotoUrl(null))
      .catch((err) => setError(parseError(err).message))
      .finally(() => setPhotoBusy(false))
  }

  /** Creating: nothing to upload to yet, so just keep the file and preview it. */
  const onPickNewPhoto = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const onClearNewPhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  // Releases the previous preview when it is replaced, and on unmount.
  useEffect(() => {
    if (!photoPreview) return undefined
    return () => URL.revokeObjectURL(photoPreview)
  }, [photoPreview])

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
      .then((saved) => {
        if (editing || !photoFile) {
          navigate('/staff/vehicles')
          return undefined
        }
        // The vehicle now has an id, so the photo has somewhere to go.
        return vehicleApi.uploadPhoto(saved.vehicleId, photoFile)
          .then(() => navigate('/staff/vehicles'))
          .catch((err) => {
            // The vehicle itself was created. Send them to it rather than
            // leaving a create form that would make a second one on resubmit.
            navigate(`/staff/vehicles/${saved.vehicleId}/edit`, {
              replace: true,
              state: { photoError: `The vehicle was created, but its photo did not upload: ${parseError(err).message}` },
            })
          })
      })
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

  // Editing shows what the server holds; creating shows the pending file.
  const shownPhoto = editing ? photoUrl : photoPreview
  const pickLabel = editing
    ? (photoBusy ? 'Uploading…' : photoUrl ? 'Replace photo' : 'Upload photo')
    : (photoPreview ? 'Choose a different photo' : 'Choose photo')

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

          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14, marginBottom: 4 }}>Photo</h3>
            <p className="cell-sub" style={{ marginBottom: 12 }}>
              Shown to customers on the public browse page. JPG, PNG, WEBP or GIF, up to 5 MB.
            </p>

            <div className="photo-editor">
              {shownPhoto
                ? <img className="photo-preview" src={shownPhoto} alt="Vehicle" />
                : <div className="photo-preview empty">No photo</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  {pickLabel}
                  <input type="file" accept="image/*" onChange={editing ? onPickPhoto : onPickNewPhoto}
                         disabled={photoBusy || saving} style={{ display: 'none' }} />
                </label>
                {shownPhoto && (
                  <button type="button" className="btn-link danger"
                          onClick={editing ? onRemovePhoto : onClearNewPhoto}
                          disabled={photoBusy || saving}>
                    Remove photo
                  </button>
                )}
              </div>
            </div>

            {!editing && photoFile && (
              <div className="field-hint" style={{ marginTop: 10 }}>
                Uploaded when you create the vehicle.
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/staff/vehicles')} disabled={saving}>
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
