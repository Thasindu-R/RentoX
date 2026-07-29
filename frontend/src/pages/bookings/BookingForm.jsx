import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  bookingApi, BOOKING_STATUSES, customerApi, driverApi, money, parseError, vehicleApi,
} from '../../api.js'
import FormField, { Alert } from '../../components/FormField.jsx'

const EMPTY = {
  customerId: '', vehicleId: '', driverId: '',
  startDate: '', endDate: '', status: 'PENDING',
}

export default function BookingForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const jobs = [
      customerApi.list().then(setCustomers),
      vehicleApi.list().then(setVehicles),
      driverApi.list().then(setDrivers),
    ]

    if (editing) {
      jobs.push(
        bookingApi.get(id).then((b) =>
          setForm({
            customerId: b.customer?.customerId ?? '',
            vehicleId: b.vehicle?.vehicleId ?? '',
            driverId: b.driver?.driverId ?? '',
            startDate: b.startDate ?? '',
            endDate: b.endDate ?? '',
            status: b.status ?? 'PENDING',
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

  /**
   * Live preview of what the server will calculate. This mirrors
   * BookingService.calculateTotalAmount, including the rule that a same-day
   * booking counts as one day. The server is still the authority - the value
   * posted to the API never includes a total.
   */
  const estimate = useMemo(() => {
    const vehicle = vehicles.find((v) => String(v.vehicleId) === String(form.vehicleId))
    const driver = drivers.find((d) => String(d.driverId) === String(form.driverId))
    if (!vehicle?.category || !form.startDate || !form.endDate) return null

    const start = new Date(form.startDate)
    const end = new Date(form.endDate)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null

    const rawDays = Math.round((end - start) / 86400000)
    const days = Math.max(1, rawDays)
    const vehicleRate = Number(vehicle.category.dailyRate ?? 0)
    const driverRate = driver ? Number(driver.dailyCharge ?? 0) : 0

    return {
      days,
      vehicleRate,
      driverRate,
      vehicleTotal: days * vehicleRate,
      driverTotal: days * driverRate,
      total: days * (vehicleRate + driverRate),
    }
  }, [form.vehicleId, form.driverId, form.startDate, form.endDate, vehicles, drivers])

  const submit = (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})

    const payload = {
      customerId: form.customerId === '' ? null : Number(form.customerId),
      vehicleId: form.vehicleId === '' ? null : Number(form.vehicleId),
      driverId: form.driverId === '' ? null : Number(form.driverId),
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
    }

    const request = editing ? bookingApi.update(id, payload) : bookingApi.create(payload)
    request
      .then((saved) => navigate(`/bookings/${saved.bookingId}`))
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

  const missing = customers.length === 0 || vehicles.length === 0

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{editing ? `Edit Booking #${id}` : 'New Booking'}</h1>
          <p>Pick the customer, vehicle and dates — the total is calculated for you.</p>
        </div>
      </div>

      <Alert kind="error" onClose={() => setError('')}>{error}</Alert>

      {missing && (
        <Alert kind="info">
          You need at least one customer and one vehicle before a booking can be created.
        </Alert>
      )}

      <form className="card" onSubmit={submit}>
        <div className="card-body">
          <div className="form-grid">
            <FormField label="Customer" name="customerId" as="select" value={form.customerId} onChange={change}
                       required error={fieldErrors.customerId}
                       options={customers.map((c) => ({ value: c.customerId, label: `${c.fullName} — ${c.nic}` }))} />
            <FormField label="Vehicle" name="vehicleId" as="select" value={form.vehicleId} onChange={change}
                       required error={fieldErrors.vehicleId}
                       options={vehicles.map((v) => ({
                         value: v.vehicleId,
                         label: `${v.registrationNumber} — ${v.brand} ${v.model} (${v.status})`,
                       }))} />
            <FormField label="Driver" name="driverId" as="select" value={form.driverId} onChange={change}
                       error={fieldErrors.driverId}
                       hint="Leave empty for a self-drive rental"
                       options={drivers.map((d) => ({
                         value: d.driverId,
                         label: `${d.fullName} — ${money(d.dailyCharge)}/day${d.available ? '' : ' (unavailable)'}`,
                       }))} />
            <FormField label="Status" name="status" as="select" value={form.status} onChange={change}
                       error={fieldErrors.status} options={BOOKING_STATUSES} />
            <FormField label="Start Date" name="startDate" type="date" value={form.startDate} onChange={change}
                       required error={fieldErrors.startDate} />
            <FormField label="End Date" name="endDate" type="date" value={form.endDate} onChange={change}
                       required error={fieldErrors.endDate}
                       hint="Same day as the start counts as one day" />
          </div>

          {estimate && (
            <div style={{ marginTop: 20, padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
              <div className="detail-label" style={{ marginBottom: 8 }}>Estimated Cost</div>
              <div className="summary-row">
                <span>Vehicle · {estimate.days} day{estimate.days === 1 ? '' : 's'} × {money(estimate.vehicleRate)}</span>
                <span>{money(estimate.vehicleTotal)}</span>
              </div>
              {estimate.driverRate > 0 && (
                <div className="summary-row">
                  <span>Driver · {estimate.days} day{estimate.days === 1 ? '' : 's'} × {money(estimate.driverRate)}</span>
                  <span>{money(estimate.driverTotal)}</span>
                </div>
              )}
              <div className="summary-row total">
                <span>Total</span>
                <span>{money(estimate.total)}</span>
              </div>
              <div className="field-hint" style={{ marginTop: 8 }}>
                The server recalculates this on save — this preview is only a guide.
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/bookings')} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || missing}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Booking'}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}
