import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  bookingApi, money, parseError, paymentApi, PAYMENT_METHODS, PAYMENT_TYPES,
} from '../../api.js'
import FormField, { Alert } from '../../components/FormField.jsx'

const EMPTY = { bookingId: '', amount: '', paymentMethod: '', paymentType: '', paymentDate: '' }

export default function PaymentForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [form, setForm] = useState({ ...EMPTY, bookingId: searchParams.get('bookingId') ?? '' })
  const [bookings, setBookings] = useState([])
  const [balance, setBalance] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const jobs = [bookingApi.list().then(setBookings)]

    if (editing) {
      jobs.push(
        paymentApi.get(id).then((p) =>
          setForm({
            bookingId: p.booking?.bookingId ?? '',
            amount: p.amount ?? '',
            paymentMethod: p.paymentMethod ?? '',
            paymentType: p.paymentType ?? '',
            paymentDate: p.paymentDate ?? '',
          })
        )
      )
    }

    Promise.all(jobs)
      .catch((err) => setError(parseError(err).message))
      .finally(() => setLoading(false))
  }, [id])

  // Whenever a booking is chosen, show what is still owed on it.
  useEffect(() => {
    if (!form.bookingId) { setBalance(null); return }
    paymentApi.balance(form.bookingId).then(setBalance).catch(() => setBalance(null))
  }, [form.bookingId])

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
      bookingId: form.bookingId === '' ? null : Number(form.bookingId),
      amount: form.amount === '' ? null : Number(form.amount),
      paymentMethod: form.paymentMethod,
      paymentType: form.paymentType,
      paymentDate: form.paymentDate || null,
    }

    const request = editing ? paymentApi.update(id, payload) : paymentApi.create(payload)
    request
      .then(() => navigate('/staff/payments'))
      .catch((err) => {
        const parsed = parseError(err)
        setError(parsed.message)
        setFieldErrors(parsed.fieldErrors)
      })
      .finally(() => setSaving(false))
  }

  const payFullBalance = () => {
    if (balance) setForm((f) => ({ ...f, amount: String(balance.balanceDue) }))
  }

  if (loading) {
    return <div className="card"><div className="state"><div className="spinner" /></div></div>
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{editing ? 'Edit Payment' : 'Record Payment'}</h1>
          <p>Record and manage rental payments here.</p>
        </div>
      </div>

      <Alert kind="error" onClose={() => setError('')}>{error}</Alert>

      {bookings.length === 0 && (
        <Alert kind="info">There are no bookings yet. Create a booking before recording a payment.</Alert>
      )}

      <form className="card" onSubmit={submit}>
        <div className="card-body">
          <div className="form-grid">
            <FormField label="Booking" name="bookingId" as="select" value={form.bookingId} onChange={change}
                       required error={fieldErrors.bookingId} full
                       options={bookings.map((b) => ({
                         value: b.bookingId,
                         label: `#${b.bookingId} — ${b.customer?.fullName ?? 'Unknown'} · ${b.vehicle?.registrationNumber ?? ''} · ${money(b.totalAmount)}`,
                       }))} />

            <FormField label="Amount (Rs.)" name="amount" type="number" step="0.01" min="0.01"
                       value={form.amount} onChange={change} required error={fieldErrors.amount}
                       placeholder="10000.00" />
            <FormField label="Payment Date" name="paymentDate" type="date" value={form.paymentDate}
                       onChange={change} error={fieldErrors.paymentDate}
                       hint="Leave empty to use today" />
            <FormField label="Payment Type" name="paymentType" as="select" value={form.paymentType}
                       onChange={change} required error={fieldErrors.paymentType} options={PAYMENT_TYPES} />
            <FormField label="Payment Method" name="paymentMethod" as="select" value={form.paymentMethod}
                       onChange={change} required error={fieldErrors.paymentMethod} options={PAYMENT_METHODS} />
          </div>

          {balance && (
            <div style={{ marginTop: 20, padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
              <div className="detail-label" style={{ marginBottom: 8 }}>Booking #{balance.bookingId} balance</div>
              <div className="summary-row"><span>Booking total</span><span>{money(balance.totalAmount)}</span></div>
              <div className="summary-row"><span>Already paid</span><span>{money(balance.totalPaid)}</span></div>
              <div className="summary-row total">
                <span>Balance due</span>
                <span style={{ color: balance.fullySettled ? 'var(--green)' : 'var(--red)' }}>
                  {money(balance.balanceDue)}
                </span>
              </div>
              {!balance.fullySettled && !editing && (
                <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 10 }} onClick={payFullBalance}>
                  Use full balance
                </button>
              )}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/staff/payments')} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || bookings.length === 0}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Record Payment'}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}
