import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { bookingApi, BOOKING_STATUSES, money, parseError, statusClass } from '../../api.js'
import DataTable from '../../components/DataTable.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import { Alert } from '../../components/FormField.jsx'

export default function BookingList() {
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  const load = () => {
    setLoading(true)
    bookingApi.list({ status, from, to })
      .then((data) => { setRows(data); setError('') })
      .catch((err) => setError(parseError(err).message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    // Only send the date range once both ends are filled in.
    if ((from && !to) || (!from && to)) return
    load()
  }, [status, from, to])

  const changeStatus = (b, next) => {
    bookingApi.setStatus(b.bookingId, next)
      .then(() => { setNotice(`Booking #${b.bookingId} is now ${next}.`); load() })
      .catch((err) => setError(parseError(err).message))
  }

  /**
   * Cancelling keeps the booking and its payment history - it only moves the
   * status, which is what the customer sees on their My Bookings page. The
   * server frees the vehicle again as part of the same change.
   */
  const confirmCancel = () => {
    setBusy(true)
    bookingApi.setStatus(target.bookingId, 'CANCELLED')
      .then(() => {
        setNotice(`Booking #${target.bookingId} was cancelled. ${target.customer?.fullName ?? 'The customer'} will see it as cancelled under My Bookings.`)
        setTarget(null)
        load()
      })
      .catch((err) => { setError(parseError(err).message); setTarget(null) })
      .finally(() => setBusy(false))
  }

  const clearFilters = () => { setStatus(''); setFrom(''); setTo('') }

  const columns = [
    { key: 'bookingId', header: '#', render: (b) => <Link to={`/staff/bookings/${b.bookingId}`} className="cell-strong">#{b.bookingId}</Link> },
    {
      key: 'customer', header: 'Customer',
      render: (b) => (
        <>
          <div className="cell-strong">{b.customer?.fullName ?? '—'}</div>
          <div className="cell-sub">{b.customer?.phone}</div>
        </>
      ),
    },
    {
      key: 'vehicle', header: 'Vehicle',
      render: (b) => (
        <>
          <div className="mono">{b.vehicle?.registrationNumber ?? '—'}</div>
          <div className="cell-sub">{b.vehicle?.brand} {b.vehicle?.model}</div>
        </>
      ),
    },
    { key: 'driver', header: 'Driver', render: (b) => b.driver?.fullName ?? <span className="cell-sub">Self-drive</span> },
    {
      key: 'period', header: 'Period',
      render: (b) => (
        <>
          <div>{b.startDate} → {b.endDate}</div>
          <div className="cell-sub">{b.totalDays} day{b.totalDays === 1 ? '' : 's'}</div>
        </>
      ),
    },
    { key: 'totalAmount', header: 'Total', align: 'right', render: (b) => <span className="cell-strong">{money(b.totalAmount)}</span> },
    {
      key: 'status', header: 'Status',
      render: (b) => (
        <select
          className={statusClass(b.status)}
          style={{ border: 'none', cursor: 'pointer', font: 'inherit', fontWeight: 600, padding: '3px 6px' }}
          value={b.status}
          onChange={(e) => changeStatus(b, e.target.value)}
        >
          {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ),
    },
  ]

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Bookings</h1>
          <p>Rental bookings, placed by customers.</p>
        </div>
      </div>

      <Alert kind="error" onClose={() => setError('')}>{error}</Alert>
      <Alert kind="success" onClose={() => setNotice('')}>{notice}</Alert>

      <div className="card">
        <div className="card-head">
          <div className="toolbar">
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="cell-sub" style={{ marginLeft: 4 }}>Period</span>
            <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                   aria-label="From date" title="From date" />
            <span className="cell-sub">to</span>
            <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)}
                   aria-label="To date" title="To date" />
            {(status || from || to) && (
              <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Clear</button>
            )}
          </div>
          <span className="cell-sub">{rows.length} booking{rows.length === 1 ? '' : 's'}</span>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          rowKey={(b) => b.bookingId}
          emptyTitle="No bookings found"
          emptyText="Adjust the filters — bookings arrive when customers rent a vehicle."
          actions={(b) => (
            <>
              <button className="btn-link" onClick={() => navigate(`/staff/bookings/${b.bookingId}`)}>View</button>
              {b.status !== 'CANCELLED' && (
                <button className="btn-link danger" onClick={() => setTarget(b)}>Cancel</button>
              )}
            </>
          )}
        />
      </div>

      <ConfirmDialog
        open={!!target}
        busy={busy}
        title="Cancel this booking?"
        message={`Booking #${target?.bookingId} for ${target?.customer?.fullName ?? 'this customer'} will be marked CANCELLED, and they will see that on their My Bookings page. The vehicle becomes available again. Payments already recorded are kept.`}
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        onConfirm={confirmCancel}
        onCancel={() => setTarget(null)}
      />
    </>
  )
}
