import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { money, parseError, paymentApi, PAYMENT_METHODS } from '../../api.js'
import DataTable from '../../components/DataTable.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import { Alert } from '../../components/FormField.jsx'

export default function PaymentList() {
  const [rows, setRows] = useState([])
  const [method, setMethod] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  const load = () => {
    setLoading(true)
    paymentApi.list()
      .then((data) => { setRows(data); setError('') })
      .catch((err) => setError(parseError(err).message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  // The payments endpoint returns everything, so method and booking filtering
  // happen in the browser. The list is small enough that this is fine.
  const visible = useMemo(() => {
    return rows.filter((p) => {
      if (method && p.paymentMethod !== method) return false
      if (search.trim() && !String(p.booking?.bookingId ?? '').includes(search.trim())) return false
      return true
    })
  }, [rows, method, search])

  const totalShown = useMemo(
    () => visible.reduce((sum, p) => sum + Number(p.amount ?? 0), 0),
    [visible]
  )

  const confirmDelete = () => {
    setBusy(true)
    paymentApi.remove(target.paymentId)
      .then(() => { setNotice(`Payment #${target.paymentId} was removed.`); setTarget(null); load() })
      .catch((err) => { setError(parseError(err).message); setTarget(null) })
      .finally(() => setBusy(false))
  }

  const columns = [
    { key: 'paymentId', header: '#', render: (p) => <span className="cell-strong">#{p.paymentId}</span> },
    {
      key: 'booking', header: 'Booking',
      render: (p) => (
        <Link to={`/staff/bookings/${p.booking?.bookingId}`}>
          #{p.booking?.bookingId}
        </Link>
      ),
    },
    { key: 'paymentDate', header: 'Date' },
    { key: 'paymentType', header: 'Type', render: (p) => <span className="badge badge-grey">{p.paymentType}</span> },
    { key: 'paymentMethod', header: 'Method', render: (p) => <span className="badge badge-blue">{p.paymentMethod}</span> },
    { key: 'amount', header: 'Amount', align: 'right', render: (p) => <span className="cell-strong">{money(p.amount)}</span> },
  ]

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Payments</h1>
          <p>Payments recorded against bookings.</p>
        </div>
        <Link to="/staff/payments/new" className="btn btn-primary">+ Record Payment</Link>
      </div>

      <Alert kind="error" onClose={() => setError('')}>{error}</Alert>
      <Alert kind="success" onClose={() => setNotice('')}>{notice}</Alert>

      <div className="card">
        <div className="card-head">
          <div className="toolbar">
            <input
              className="input"
              placeholder="Filter by booking number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="select" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="">All methods</option>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <span className="cell-sub">
            {visible.length} payment{visible.length === 1 ? '' : 's'} · {money(totalShown)}
          </span>
        </div>

        <DataTable
          columns={columns}
          rows={visible}
          loading={loading}
          rowKey={(p) => p.paymentId}
          emptyTitle="No payments found"
          emptyText="Record a payment against a booking to see it here."
          actions={(p) => (
            <>
              <button className="btn-link" onClick={() => navigate(`/staff/payments/${p.paymentId}/edit`)}>Edit</button>
              <button className="btn-link danger" onClick={() => setTarget(p)}>Delete</button>
            </>
          )}
        />
      </div>

      <ConfirmDialog
        open={!!target}
        busy={busy}
        title="Delete payment?"
        message={`Payment #${target?.paymentId} of ${money(target?.amount)} will be removed and the balance due will go back up.`}
        onConfirm={confirmDelete}
        onCancel={() => setTarget(null)}
      />
    </>
  )
}
