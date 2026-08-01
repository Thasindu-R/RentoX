import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { bookingApi, money, parseError, paymentApi, statusClass } from '../../api.js'
import DataTable from '../../components/DataTable.jsx'
import { Alert } from '../../components/FormField.jsx'

function Detail({ label, children }) {
  return (
    <div>
      <div className="detail-label">{label}</div>
      <div className="detail-value">{children ?? '—'}</div>
    </div>
  )
}

export default function BookingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [booking, setBooking] = useState(null)
  const [payments, setPayments] = useState([])
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    // Payments are fetched separately: the booking JSON deliberately does not
    // embed them, because that collection is lazy on the backend.
    Promise.all([
      bookingApi.get(id),
      paymentApi.byBooking(id),
      paymentApi.balance(id),
    ])
      .then(([b, p, bal]) => { setBooking(b); setPayments(p); setBalance(bal); setError('') })
      .catch((err) => setError(parseError(err).message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  if (loading) {
    return <div className="card"><div className="state"><div className="spinner" /></div></div>
  }

  if (!booking) {
    return (
      <>
        <Alert kind="error">{error || 'Booking not found.'}</Alert>
        <Link to="/staff/bookings" className="btn btn-secondary">← Back to bookings</Link>
      </>
    )
  }

  const paymentColumns = [
    { key: 'paymentId', header: '#', render: (p) => `#${p.paymentId}` },
    { key: 'paymentDate', header: 'Date' },
    { key: 'paymentType', header: 'Type', render: (p) => <span className="badge badge-grey">{p.paymentType}</span> },
    { key: 'paymentMethod', header: 'Method', render: (p) => <span className="badge badge-blue">{p.paymentMethod}</span> },
    { key: 'amount', header: 'Amount', align: 'right', render: (p) => <span className="cell-strong">{money(p.amount)}</span> },
  ]

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Booking #{booking.bookingId}</h1>
          <p>
            Created for {booking.customer?.fullName} ·{' '}
            <span className={statusClass(booking.status)}>{booking.status}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/staff/bookings')}>← Back</button>
          <Link to="/staff/payments/new" className="btn btn-primary">+ Record Payment</Link>
        </div>
      </div>

      <Alert kind="error" onClose={() => setError('')}>{error}</Alert>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h2>Booking Details</h2></div>
        <div className="card-body">
          <div className="detail-grid">
            <Detail label="Customer">
              <div className="cell-strong">{booking.customer?.fullName}</div>
              <div className="cell-sub">{booking.customer?.phone} · {booking.customer?.nic}</div>
            </Detail>
            <Detail label="Vehicle">
              <div className="mono cell-strong">{booking.vehicle?.registrationNumber}</div>
              <div className="cell-sub">
                {booking.vehicle?.brand} {booking.vehicle?.model} · {booking.vehicle?.category?.categoryName}
              </div>
            </Detail>
            <Detail label="Driver">
              {booking.driver
                ? <>
                    <div className="cell-strong">{booking.driver.fullName}</div>
                    <div className="cell-sub">{money(booking.driver.dailyCharge)}/day</div>
                  </>
                : <span className="cell-sub">Self-drive</span>}
            </Detail>
            <Detail label="Rental Period">
              <div>{booking.startDate} → {booking.endDate}</div>
              <div className="cell-sub">{booking.totalDays} day{booking.totalDays === 1 ? '' : 's'}</div>
            </Detail>
            <Detail label="Daily Rate">{money(booking.vehicle?.category?.dailyRate)}</Detail>
            <Detail label="Total Amount">
              <span className="cell-strong">{money(booking.totalAmount)}</span>
            </Detail>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h2>Payment Summary</h2></div>
        <div className="card-body">
          <div className="summary-row">
            <span>Booking total</span>
            <span>{money(balance?.totalAmount)}</span>
          </div>
          <div className="summary-row">
            <span>Paid so far ({payments.length} payment{payments.length === 1 ? '' : 's'})</span>
            <span>{money(balance?.totalPaid)}</span>
          </div>
          <div className="summary-row total">
            <span>Balance due</span>
            <span style={{ color: balance?.fullySettled ? 'var(--green)' : 'var(--red)' }}>
              {money(balance?.balanceDue)}
            </span>
          </div>
          {balance?.fullySettled && (
            <div style={{ marginTop: 12 }}>
              <span className="badge badge-green">Fully settled</span>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Payments</h2>
          <Link to="/staff/payments/new" className="btn-link">+ Record payment</Link>
        </div>
        <DataTable
          columns={paymentColumns}
          rows={payments}
          rowKey={(p) => p.paymentId}
          emptyTitle="No payments recorded"
          emptyText="Record an advance or full payment against this booking."
        />
      </div>
    </>
  )
}
