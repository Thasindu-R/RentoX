import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import {
  bookingApi, money, parseError, paymentApi, statusClass, vehicleImageUrl,
} from '../../api.js'
import { Alert } from '../../components/FormField.jsx'

/** A customer's own rentals, with what they still owe on each. */
export default function MyBookings({ customer }) {
  const [bookings, setBookings] = useState([])
  const [balances, setBalances] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const location = useLocation()
  const [notice, setNotice] = useState(
    location.state?.justBooked ? 'Your booking is confirmed. Our staff will be in touch.' : ''
  )

  useEffect(() => {
    if (!customer) return
    bookingApi.byCustomer(customer.customerId)
      .then((list) => {
        const sorted = [...list].sort((a, b) => b.bookingId - a.bookingId)
        setBookings(sorted)
        // Balance comes from its own endpoint, one call per booking.
        return Promise.all(
          sorted.map((b) =>
            paymentApi.balance(b.bookingId)
              .then((bal) => [b.bookingId, bal])
              .catch(() => [b.bookingId, null])
          )
        )
      })
      .then((pairs) => setBalances(Object.fromEntries(pairs || [])))
      .catch((err) => setError(parseError(err).message))
      .finally(() => setLoading(false))
  }, [customer])

  if (!customer) {
    return <Navigate to="/login" replace state={{ redirectTo: '/my-bookings' }} />
  }

  return (
    <div className="site-content">
      <h1 style={{ marginBottom: 4 }}>My Bookings</h1>
      <p className="cell-sub" style={{ marginBottom: 18 }}>
        Rentals booked with your account.
      </p>

      <Alert kind="success" onClose={() => setNotice('')}>{notice}</Alert>
      <Alert kind="error" onClose={() => setError('')}>{error}</Alert>

      {loading ? (
        <div className="state"><div className="spinner" /></div>
      ) : bookings.length === 0 ? (
        <div className="state">
          <div className="state-icon">◻</div>
          <div className="state-title">No bookings yet</div>
          <div style={{ marginBottom: 14 }}>Browse the fleet and book your first vehicle.</div>
          <Link to="/" className="btn btn-primary">Browse vehicles</Link>
        </div>
      ) : (
        <div className="booking-list">
          {bookings.map((b) => {
            const bal = balances[b.bookingId]
            const img = vehicleImageUrl(b.vehicle)
            return (
              <article className="card booking-row" key={b.bookingId}>
                {img
                  ? <img className="booking-thumb" src={img} alt={`${b.vehicle?.brand} ${b.vehicle?.model}`} />
                  : <div className="booking-thumb placeholder" />}
                <div className="booking-info">
                  <div className="booking-title">
                    <h3>{b.vehicle?.brand} {b.vehicle?.model}</h3>
                    <span className={statusClass(b.status)}>{b.status}</span>
                  </div>
                  <div className="cell-sub mono">{b.vehicle?.registrationNumber}</div>
                  <div className="booking-meta">
                    <span>{b.startDate} → {b.endDate}</span>
                    <span>{b.totalDays} day{b.totalDays === 1 ? '' : 's'}</span>
                    <span>{b.driver ? `Driver: ${b.driver.fullName}` : 'Self-drive'}</span>
                  </div>
                </div>
                <div className="booking-money">
                  <div className="cell-sub">Total</div>
                  <div className="booking-total">{money(b.totalAmount)}</div>
                  {bal && (
                    <div className="cell-sub" style={{ marginTop: 4 }}>
                      {bal.fullySettled
                        ? <span className="badge badge-green">Paid in full</span>
                        : <>Balance due <strong style={{ color: 'var(--red)' }}>{money(bal.balanceDue)}</strong></>}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
