import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  bookingApi, driverApi, money, parseError, vehicleApi, vehicleImageUrl,
} from '../../api.js'
import FormField, { Alert } from '../../components/FormField.jsx'
import { DRIVER_CHOICES, saveWithDriverChoice } from './driverChoice.js'

/**
 * The public rent form.
 *
 * Two things happen here that do not happen anywhere else:
 *  1. A visitor without an account is redirected to sign up first.
 *  2. NIC and driving licence are collected. Sign-up does not ask for them, so
 *     this is where they are captured and saved onto the customer record. On a
 *     second booking they are already known and simply shown pre-filled.
 */
export default function RentForm({ customer }) {
  const { vehicleId } = useParams()
  const navigate = useNavigate()

  const [vehicle, setVehicle] = useState(null)
  const [drivers, setDrivers] = useState([])
  const [form, setForm] = useState({
    startDate: '', endDate: '', driverChoice: '',
    nic: '', drivingLicenceNo: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!customer) return
    Promise.all([
      vehicleApi.get(vehicleId).then(setVehicle),
      driverApi.list(true).then(setDrivers),
    ])
      .catch((err) => setError(parseError(err).message))
      .finally(() => setLoading(false))
  }, [vehicleId, customer])

  // Pre-fill licence details we already hold for this customer.
  useEffect(() => {
    if (!customer) return
    setForm((f) => ({
      ...f,
      nic: f.nic || customer.nic || '',
      drivingLicenceNo: f.drivingLicenceNo || customer.drivingLicenceNo || '',
    }))
  }, [customer])

  // The redirect the brief asks for.
  if (!customer) {
    return <Navigate to="/signup" replace state={{ redirectTo: `/rent/${vehicleId}` }} />
  }

  const change = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setFieldErrors((fe) => (fe[name] ? { ...fe, [name]: undefined } : fe))
  }

  /** Mirrors BookingService.calculateTotalAmount, same-day counts as one day. */
  const estimate = useMemo(() => {
    const rate = Number(vehicle?.category?.dailyRate ?? 0)
    if (!rate || !form.startDate || !form.endDate) return null
    const start = new Date(form.startDate)
    const end = new Date(form.endDate)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null

    const days = Math.max(1, Math.round((end - start) / 86400000))
    // Which driver is assigned is decided on submit, so the first available
    // one stands in for the charge until the server confirms it.
    const driverRate = form.driverChoice === 'DRIVER'
      ? Number(drivers[0]?.dailyCharge ?? 0)
      : 0
    return {
      days, rate, driverRate,
      vehicleTotal: days * rate,
      driverTotal: days * driverRate,
      total: days * (rate + driverRate),
    }
  }, [vehicle, drivers, form.startDate, form.endDate, form.driverChoice])

  const submit = (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})

    saveWithDriverChoice(
      bookingApi.create,
      {
        customerId: customer.customerId,
        vehicleId: Number(vehicleId),
        startDate: form.startDate,
        endDate: form.endDate,
        nic: form.nic,
        drivingLicenceNo: form.drivingLicenceNo,
      },
      form.driverChoice,
      drivers,
    )
      .then(() => navigate('/my-bookings', { state: { justBooked: true } }))
      .catch((err) => {
        const parsed = parseError(err)
        setError(parsed.message)
        setFieldErrors(parsed.fieldErrors)
      })
      .finally(() => setSaving(false))
  }

  if (loading) {
    return <div className="site-content"><div className="state"><div className="spinner" /></div></div>
  }

  if (!vehicle) {
    return (
      <div className="site-content">
        <Alert kind="error">{error || 'Vehicle not found.'}</Alert>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>← Back to browse</button>
      </div>
    )
  }

  const img = vehicleImageUrl(vehicle)

  return (
    <div className="site-content">
      <button className="btn-link" style={{ marginBottom: 12 }} onClick={() => navigate('/')}>
        ← Back to browse
      </button>

      <h1 style={{ marginBottom: 4 }}>Rent {vehicle.brand} {vehicle.model}</h1>
      <p className="cell-sub" style={{ marginBottom: 18 }}>
        {vehicle.category?.categoryName} · {money(vehicle.category?.dailyRate)} per day
      </p>

      <Alert kind="error" onClose={() => setError('')}>{error}</Alert>

      <div className="rent-layout">
        <form className="card" onSubmit={submit}>
          <div className="card-body">
            <div className="form-grid">
              <FormField label="Start Date" name="startDate" type="date" value={form.startDate}
                         onChange={change} required error={fieldErrors.startDate} />
              <FormField label="End Date" name="endDate" type="date" value={form.endDate}
                         onChange={change} required error={fieldErrors.endDate} />

              <FormField label="Driver" name="driverChoice" as="select" value={form.driverChoice}
                         onChange={change} required error={fieldErrors.driverId} full
                         options={DRIVER_CHOICES} />
            </div>

            <div className="rent-licence">
              <h3>Licence details</h3>
              {!customer.nic && (
                <p className="cell-sub">
                  We need these before you can rent a vehicle. They are saved to your account for next time.
                </p>
              )}
              <div className="form-grid">
                <FormField label="NIC" name="nic" value={form.nic} onChange={change}
                           required error={fieldErrors.nic} placeholder="200012345678" />
                <FormField label="Driving Licence No" name="drivingLicenceNo"
                           value={form.drivingLicenceNo} onChange={change}
                           required error={fieldErrors.drivingLicenceNo} placeholder="B1234567" />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/')} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Confirming…' : 'Confirm booking'}
              </button>
            </div>
          </div>
        </form>

        <aside className="card rent-summary">
          {img
            ? <img className="vehicle-photo" src={img} alt={`${vehicle.brand} ${vehicle.model}`} />
            : null}
          <div className="card-body">
            <h3 style={{ marginBottom: 10 }}>{vehicle.brand} {vehicle.model}</h3>
            <div className="summary-row">
              <span>Registration</span><span className="mono">{vehicle.registrationNumber}</span>
            </div>
            <div className="summary-row">
              <span>Category</span><span>{vehicle.category?.categoryName}</span>
            </div>
            <div className="summary-row">
              <span>Daily rate</span><span>{money(vehicle.category?.dailyRate)}</span>
            </div>

            {estimate ? (
              <>
                <div className="summary-row">
                  <span>{estimate.days} day{estimate.days === 1 ? '' : 's'} × {money(estimate.rate)}</span>
                  <span>{money(estimate.vehicleTotal)}</span>
                </div>
                {estimate.driverRate > 0 && (
                  <div className="summary-row">
                    <span>Driver × {estimate.days}</span>
                    <span>{money(estimate.driverTotal)}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Estimated total</span><span>{money(estimate.total)}</span>
                </div>
                <div className="field-hint">Confirmed by the server when you book.</div>
              </>
            ) : (
              <div className="field-hint" style={{ marginTop: 10 }}>
                Pick your dates to see the total.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
