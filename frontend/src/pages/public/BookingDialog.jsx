import { useEffect, useMemo, useState } from 'react'
import { bookingApi, driverApi, money, parseError, statusClass } from '../../api.js'
import FormField, { Alert } from '../../components/FormField.jsx'
import { choiceFor, DRIVER_CHOICES, saveWithDriverChoice } from './driverChoice.js'

function Detail({ label, children }) {
  return (
    <div>
      <div className="detail-label">{label}</div>
      <div className="detail-value">{children || '—'}</div>
    </div>
  )
}

/**
 * A customer looking at one of their own bookings.
 *
 * Only a PENDING booking can be changed: once staff mark it ACTIVE the vehicle
 * is already out, and a COMPLETED or CANCELLED one is history. The server
 * recalculates the days and the total from the dates, so the figures shown
 * while editing are an estimate until it answers.
 */
export default function BookingDialog({
  booking, balance, customerId, initialMode = 'view', onClose, onSaved,
}) {
  const editable = booking?.status === 'PENDING'

  const [mode, setMode] = useState(initialMode)
  const [drivers, setDrivers] = useState([])
  const [form, setForm] = useState({ startDate: '', endDate: '', driverChoice: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Reset whenever a different booking is opened.
  useEffect(() => {
    if (!booking) return
    setMode(booking.status === 'PENDING' ? initialMode : 'view')
    setForm({
      startDate: booking.startDate ?? '',
      endDate: booking.endDate ?? '',
      driverChoice: choiceFor(booking),
    })
    setFieldErrors({})
    setError('')
  }, [booking, initialMode])

  // Only needed once they actually start editing.
  useEffect(() => {
    if (mode !== 'edit') return
    driverApi.list(true)
      .then(setDrivers)
      .catch((err) => setError(parseError(err).message))
  }, [mode])

  /** Mirrors BookingService.calculateTotalAmount; same day counts as one day. */
  const estimate = useMemo(() => {
    const rate = Number(booking?.vehicle?.category?.dailyRate ?? 0)
    if (!rate || !form.startDate || !form.endDate) return null
    const start = new Date(form.startDate)
    const end = new Date(form.endDate)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null

    const days = Math.max(1, Math.round((end - start) / 86400000))
    // Which driver is assigned is decided on save, so the first available one
    // stands in for the charge until the server confirms it.
    const driverRate = form.driverChoice === 'DRIVER'
      ? Number(drivers[0]?.dailyCharge ?? 0)
      : 0
    return { days, total: days * (rate + driverRate) }
  }, [booking, drivers, form.startDate, form.endDate, form.driverChoice])

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

    // No status in the payload: the server leaves it alone, so it stays PENDING.
    // NIC and licence are left out too - they are already on the account, and
    // the server keeps what it holds when they are not sent.
    saveWithDriverChoice(
      (data) => bookingApi.update(booking.bookingId, data),
      {
        customerId,
        vehicleId: booking.vehicle?.vehicleId,
        startDate: form.startDate,
        endDate: form.endDate,
      },
      form.driverChoice,
      drivers,
    )
      .then(() => onSaved())
      .catch((err) => {
        const parsed = parseError(err)
        setError(parsed.message)
        setFieldErrors(parsed.fieldErrors)
      })
      .finally(() => setSaving(false))
  }

  if (!booking) return null

  const editing = mode === 'edit'

  return (
    <div className="modal-backdrop" onClick={saving ? undefined : onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <h3>
          Booking #{booking.bookingId}{' '}
          <span className={statusClass(booking.status)}>{booking.status}</span>
        </h3>
        <p>{booking.vehicle?.brand} {booking.vehicle?.model} · {booking.vehicle?.registrationNumber}</p>

        <Alert kind="error" onClose={() => setError('')}>{error}</Alert>

        {editing ? (
          <form onSubmit={save}>
            <div className="form-grid">
              <FormField label="Start Date" name="startDate" type="date" value={form.startDate}
                         onChange={change} required error={fieldErrors.startDate} />
              <FormField label="End Date" name="endDate" type="date" value={form.endDate}
                         onChange={change} required error={fieldErrors.endDate} />
              <FormField label="Driver" name="driverChoice" as="select" value={form.driverChoice}
                         onChange={change} required error={fieldErrors.driverId} full
                         options={DRIVER_CHOICES} />
            </div>

            <div className="summary-row total" style={{ marginTop: 6 }}>
              <span>{estimate ? `${estimate.days} day${estimate.days === 1 ? '' : 's'}` : 'New total'}</span>
              <span>{estimate ? money(estimate.total) : '—'}</span>
            </div>
            <div className="field-hint">Confirmed by the server when you save.</div>

            <div className="modal-actions" style={{ marginTop: 18 }}>
              <button type="button" className="btn btn-secondary"
                      onClick={() => setMode('view')} disabled={saving}>
                Back
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="detail-grid">
              <Detail label="Dates">{booking.startDate} → {booking.endDate}</Detail>
              <Detail label="Days">{booking.totalDays}</Detail>
              <Detail label="Driver">{booking.driver?.fullName || 'Self-drive'}</Detail>
              <Detail label="Vehicle">
                {booking.vehicle?.brand} {booking.vehicle?.model}
              </Detail>
              <Detail label="Registration">
                <span className="mono">{booking.vehicle?.registrationNumber}</span>
              </Detail>
              <Detail label="Category">{booking.vehicle?.category?.categoryName}</Detail>
              <Detail label="Daily rate">{money(booking.vehicle?.category?.dailyRate)}</Detail>
              <Detail label="Total">{money(booking.totalAmount)}</Detail>
              <Detail label="Paid so far">
                {balance ? money(balance.totalPaid) : null}
              </Detail>
              <Detail label="Balance due">
                {balance
                  ? (balance.fullySettled
                      ? <span className="badge badge-green">Paid in full</span>
                      : money(balance.balanceDue))
                  : null}
              </Detail>
            </div>

            {!editable && (
              <div className="field-hint" style={{ marginTop: 14 }}>
                {booking.status === 'ACTIVE'
                  ? 'This rental has started, so its dates can no longer be changed here. Contact us if you need to extend it.'
                  : 'This booking is closed and can no longer be changed.'}
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: 18 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
              {editable && (
                <button type="button" className="btn btn-primary" onClick={() => setMode('edit')}>
                  Edit booking
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
