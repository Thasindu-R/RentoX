import { useEffect, useState } from 'react'
import { customerApi, parseError } from '../../api.js'
import DataTable from '../../components/DataTable.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import { Alert } from '../../components/FormField.jsx'

function Detail({ label, children }) {
  return (
    <div>
      <div className="detail-label">{label}</div>
      <div className="detail-value">{children || '—'}</div>
    </div>
  )
}

/**
 * Read-only view of one customer. Their details belong to them and are edited
 * from the public site, so there is nothing to change here.
 */
function CustomerDialog({ customer, onClose }) {
  if (!customer) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <h3>{customer.fullName}</h3>
        <p>Registered customer details.</p>

        <div className="detail-grid">
          <Detail label="Full name">{customer.fullName}</Detail>
          <Detail label="Email">{customer.email}</Detail>
          <Detail label="Phone">{customer.phone}</Detail>
          <Detail label="Registered">{customer.registeredDate}</Detail>
          <Detail label="NIC">
            {customer.nic ? <span className="mono">{customer.nic}</span> : null}
          </Detail>
          <Detail label="Driving licence no">
            {customer.drivingLicenceNo ? <span className="mono">{customer.drivingLicenceNo}</span> : null}
          </Detail>
          <Detail label="Address">{customer.address}</Detail>
        </div>

        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default function CustomerList() {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [target, setTarget] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = (q = '') => {
    setLoading(true)
    customerApi.list(q)
      .then((data) => { setRows(data); setError('') })
      .catch((err) => setError(parseError(err).message))
      .finally(() => setLoading(false))
  }

  // Debounced search: waits 300ms after typing stops so we do not fire a
  // request on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const confirmDelete = () => {
    setBusy(true)
    customerApi.remove(target.customerId)
      .then(() => {
        setNotice(`${target.fullName} was deleted.`)
        setTarget(null)
        load(search)
      })
      .catch((err) => { setError(parseError(err).message); setTarget(null) })
      .finally(() => setBusy(false))
  }

  const columns = [
    {
      key: 'fullName', header: 'Customer',
      render: (c) => (
        <>
          <div className="cell-strong">{c.fullName}</div>
          <div className="cell-sub">{c.email || 'No email'}</div>
        </>
      ),
    },
    {
      key: 'nic', header: 'NIC',
      render: (c) => c.nic
        ? <span className="mono">{c.nic}</span>
        : <span className="cell-sub">Not provided yet</span>,
    },
    {
      key: 'drivingLicenceNo', header: 'Licence',
      render: (c) => c.drivingLicenceNo
        ? <span className="mono">{c.drivingLicenceNo}</span>
        : <span className="cell-sub">—</span>,
    },
    { key: 'phone', header: 'Phone' },
    { key: 'address', header: 'Address' },
    { key: 'registeredDate', header: 'Registered' },
  ]

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Customers</h1>
        </div>
      </div>

      <Alert kind="error" onClose={() => setError('')}>{error}</Alert>
      <Alert kind="success" onClose={() => setNotice('')}>{notice}</Alert>

      <div className="card">
        <div className="card-head">
          <div className="toolbar">
            <input
              className="input grow"
              placeholder="Search by name or NIC…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="cell-sub">{rows.length} customer{rows.length === 1 ? '' : 's'}</span>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          rowKey={(c) => c.customerId}
          emptyTitle={search ? 'No matches' : 'No customers yet'}
          emptyText={search ? 'Try a different name or NIC.' : 'Customers appear here once they sign up to the system.'}
          actions={(c) => (
            <>
              <button className="btn-link" onClick={() => setViewing(c)}>View</button>
              <button className="btn-link danger" onClick={() => setTarget(c)}>Delete</button>
            </>
          )}
        />
      </div>

      <CustomerDialog customer={viewing} onClose={() => setViewing(null)} />

      <ConfirmDialog
        open={!!target}
        busy={busy}
        title="Delete customer?"
        message={`This will permanently remove ${target?.fullName}. Customers with existing bookings cannot be deleted.`}
        onConfirm={confirmDelete}
        onCancel={() => setTarget(null)}
      />
    </>
  )
}
