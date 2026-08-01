import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  bookingApi, customerApi, driverApi, vehicleApi,
  money, parseError, statusClass,
} from '../api.js'
import DataTable from '../components/DataTable.jsx'
import { Alert } from '../components/FormField.jsx'

function Stat({ label, value, foot }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {foot && <div className="stat-foot">{foot}</div>}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    // Promise.all runs the count calls together instead of one after another.
    Promise.all([
      vehicleApi.count(),
      vehicleApi.count('AVAILABLE'),
      bookingApi.count('ACTIVE'),
      bookingApi.count('PENDING'),
      customerApi.count(),
      driverApi.count(),
      bookingApi.list(),
    ])
      .then(([vehicles, available, active, pending, customers, drivers, bookings]) => {
        if (cancelled) return
        setStats({ vehicles, available, active, pending, customers, drivers })
        setRecent([...bookings].sort((a, b) => b.bookingId - a.bookingId).slice(0, 5))
        setError('')
      })
      .catch((err) => !cancelled && setError(parseError(err).message))
      .finally(() => !cancelled && setLoading(false))

    return () => { cancelled = true }
  }, [])

  const columns = [
    { key: 'bookingId', header: '#', render: (b) => <Link to={`/staff/bookings/${b.bookingId}`}>#{b.bookingId}</Link> },
    { key: 'customer', header: 'Customer', render: (b) => b.customer?.fullName ?? '—' },
    { key: 'vehicle', header: 'Vehicle', render: (b) => <span className="mono">{b.vehicle?.registrationNumber ?? '—'}</span> },
    { key: 'dates', header: 'Period', render: (b) => `${b.startDate} → ${b.endDate}` },
    { key: 'totalAmount', header: 'Total', align: 'right', render: (b) => money(b.totalAmount) },
    { key: 'status', header: 'Status', render: (b) => <span className={statusClass(b.status)}>{b.status}</span> },
  ]

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Fleet and booking summary at a glance.</p>
        </div>
      </div>

      <Alert kind="error" onClose={() => setError('')}>{error}</Alert>

      {loading ? (
        <div className="card"><div className="state"><div className="spinner" /><div style={{ marginTop: 10 }}>Loading…</div></div></div>
      ) : (
        <>
          <div className="stat-grid">
            <Stat label="Total Vehicles" value={stats?.vehicles ?? 0} foot={`${stats?.available ?? 0} available now`} />
            <Stat label="Available Vehicles" value={stats?.available ?? 0} foot="Ready to rent" />
            <Stat label="Active Bookings" value={stats?.active ?? 0} foot={`${stats?.pending ?? 0} pending`} />
            <Stat label="Total Customers" value={stats?.customers ?? 0} foot={`${stats?.drivers ?? 0} drivers on file`} />
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Recent Bookings</h2>
              <Link to="/staff/bookings" className="btn-link">View all →</Link>
            </div>
            <DataTable
              columns={columns}
              rows={recent}
              rowKey={(b) => b.bookingId}
              emptyTitle="No bookings yet"
              emptyText="Create your first booking to see it here."
            />
          </div>
        </>
      )}
    </>
  )
}
