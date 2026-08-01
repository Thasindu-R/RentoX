import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categoryApi, money, parseError, statusClass, vehicleApi, vehicleImageUrl, VEHICLE_STATUSES } from '../../api.js'
import DataTable from '../../components/DataTable.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import { Alert } from '../../components/FormField.jsx'

export default function VehicleList() {
  const [rows, setRows] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => {})
  }, [])

  /**
   * The backend keeps free-text search and structured filtering on separate
   * endpoints, so pick whichever the user is actually using.
   */
  const load = () => {
    setLoading(true)
    const request = search.trim()
      ? vehicleApi.search(search.trim())
      : vehicleApi.list({ categoryId, status })
    request
      .then((data) => { setRows(data); setError('') })
      .catch((err) => setError(parseError(err).message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search, categoryId, status])

  const cycleStatus = (v) => {
    const next = VEHICLE_STATUSES[(VEHICLE_STATUSES.indexOf(v.status) + 1) % VEHICLE_STATUSES.length]
    vehicleApi.setStatus(v.vehicleId, next)
      .then(() => { setNotice(`${v.registrationNumber} is now ${next}.`); load() })
      .catch((err) => setError(parseError(err).message))
  }

  const confirmDelete = () => {
    setBusy(true)
    vehicleApi.remove(target.vehicleId)
      .then(() => { setNotice(`${target.registrationNumber} was deleted.`); setTarget(null); load() })
      .catch((err) => { setError(parseError(err).message); setTarget(null) })
      .finally(() => setBusy(false))
  }

  const columns = [
    {
      key: 'photo', header: '', width: '64px',
      render: (v) => {
        const img = vehicleImageUrl(v)
        return img
          ? <img className="table-thumb" src={img} alt="" />
          : <span className="table-thumb" />
      },
    },
    {
      key: 'registrationNumber', header: 'Vehicle',
      render: (v) => (
        <>
          <div className="cell-strong mono">{v.registrationNumber}</div>
          <div className="cell-sub">{v.brand} {v.model}{v.year ? ` · ${v.year}` : ''}</div>
        </>
      ),
    },
    { key: 'category', header: 'Category', render: (v) => v.category?.categoryName ?? '—' },
    {
      key: 'spec', header: 'Specification',
      render: (v) => <span className="cell-sub">{[v.fuelType, v.transmission].filter(Boolean).join(' · ') || '—'}</span>,
    },
    { key: 'rate', header: 'Daily Rate', align: 'right', render: (v) => (v.category ? money(v.category.dailyRate) : '—') },
    {
      key: 'status', header: 'Status',
      render: (v) => (
        <button
          className={statusClass(v.status)}
          style={{ border: 'none', cursor: 'pointer', font: 'inherit', fontWeight: 600 }}
          title="Click to change status"
          onClick={() => cycleStatus(v)}
        >
          {v.status}
        </button>
      ),
    },
  ]

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Vehicles</h1>
          <p>Manage your rental fleet here.</p>
        </div>
        <Link to="/staff/vehicles/new" className="btn btn-primary">+ Add Vehicle</Link>
      </div>

      <Alert kind="error" onClose={() => setError('')}>{error}</Alert>
      <Alert kind="success" onClose={() => setNotice('')}>{notice}</Alert>

      <div className="card">
        <div className="card-head">
          <div className="toolbar">
            <input
              className="input grow"
              placeholder="Search registration, brand or model…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={!!search.trim()}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
              ))}
            </select>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} disabled={!!search.trim()}>
              <option value="">All statuses</option>
              {VEHICLE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <span className="cell-sub">{rows.length} vehicle{rows.length === 1 ? '' : 's'}</span>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          rowKey={(v) => v.vehicleId}
          emptyTitle="No vehicles found"
          emptyText="Adjust the filters, or add a vehicle to the fleet."
          actions={(v) => (
            <>
              <button className="btn-link" onClick={() => navigate(`/staff/vehicles/${v.vehicleId}/edit`)}>Edit</button>
              <button className="btn-link danger" onClick={() => setTarget(v)}>Delete</button>
            </>
          )}
        />
      </div>

      <ConfirmDialog
        open={!!target}
        busy={busy}
        title="Delete vehicle?"
        message={`This will remove ${target?.registrationNumber} from the fleet. Vehicles with bookings cannot be deleted.`}
        onConfirm={confirmDelete}
        onCancel={() => setTarget(null)}
      />
    </>
  )
}
