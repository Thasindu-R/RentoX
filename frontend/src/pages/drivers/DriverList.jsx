import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { driverApi, money, parseError } from '../../api.js'
import DataTable from '../../components/DataTable.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import { Alert } from '../../components/FormField.jsx'

export default function DriverList() {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [available, setAvailable] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  const load = () => {
    setLoading(true)
    const request = search.trim() ? driverApi.search(search.trim()) : driverApi.list(available)
    request
      .then((data) => { setRows(data); setError('') })
      .catch((err) => setError(parseError(err).message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search, available])

  const toggle = (d) => {
    driverApi.setAvailability(d.driverId, !d.available)
      .then(() => { setNotice(`${d.fullName} is now ${!d.available ? 'available' : 'unavailable'}.`); load() })
      .catch((err) => setError(parseError(err).message))
  }

  const confirmDelete = () => {
    setBusy(true)
    driverApi.remove(target.driverId)
      .then(() => { setNotice(`${target.fullName} was deleted.`); setTarget(null); load() })
      .catch((err) => { setError(parseError(err).message); setTarget(null) })
      .finally(() => setBusy(false))
  }

  const columns = [
    {
      key: 'fullName', header: 'Driver',
      render: (d) => (
        <>
          <div className="cell-strong">{d.fullName}</div>
          <div className="cell-sub">{d.phone}</div>
        </>
      ),
    },
    { key: 'nic', header: 'NIC', render: (d) => <span className="mono">{d.nic}</span> },
    { key: 'licenceNo', header: 'Licence', render: (d) => <span className="mono">{d.licenceNo}</span> },
    { key: 'dailyCharge', header: 'Daily Charge', align: 'right', render: (d) => money(d.dailyCharge) },
    {
      key: 'available', header: 'Availability',
      render: (d) => (
        <button
          className={'badge ' + (d.available ? 'badge-green' : 'badge-grey')}
          style={{ border: 'none', cursor: 'pointer', font: 'inherit', fontWeight: 600 }}
          title="Click to toggle"
          onClick={() => toggle(d)}
        >
          {d.available ? 'Available' : 'Unavailable'}
        </button>
      ),
    },
  ]

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Drivers</h1>
          <p>Manage your drivers here.</p>
        </div>
        <Link to="/staff/drivers/new" className="btn btn-primary">+ Add Driver</Link>
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
            <select className="select" value={available} onChange={(e) => setAvailable(e.target.value)} disabled={!!search.trim()}>
              <option value="">All drivers</option>
              <option value="true">Available only</option>
              <option value="false">Unavailable only</option>
            </select>
          </div>
          <span className="cell-sub">{rows.length} driver{rows.length === 1 ? '' : 's'}</span>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          rowKey={(d) => d.driverId}
          emptyTitle="No drivers found"
          emptyText="Adjust the filter, or add a driver."
          actions={(d) => (
            <>
              <button className="btn-link" onClick={() => navigate(`/staff/drivers/${d.driverId}/edit`)}>Edit</button>
              <button className="btn-link danger" onClick={() => setTarget(d)}>Delete</button>
            </>
          )}
        />
      </div>

      <ConfirmDialog
        open={!!target}
        busy={busy}
        title="Delete driver?"
        message={`This will remove ${target?.fullName}. Drivers assigned to bookings cannot be deleted.`}
        onConfirm={confirmDelete}
        onCancel={() => setTarget(null)}
      />
    </>
  )
}
