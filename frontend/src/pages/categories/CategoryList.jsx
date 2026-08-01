import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categoryApi, money, parseError } from '../../api.js'
import DataTable from '../../components/DataTable.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import { Alert } from '../../components/FormField.jsx'

export default function CategoryList() {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  const load = (q = '') => {
    setLoading(true)
    categoryApi.list(q)
      .then((data) => { setRows(data); setError('') })
      .catch((err) => setError(parseError(err).message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const confirmDelete = () => {
    setBusy(true)
    categoryApi.remove(target.categoryId)
      .then(() => {
        setNotice(`Category ${target.categoryName} was deleted.`)
        setTarget(null)
        load(search)
      })
      // The backend returns 409 with a readable reason when vehicles still
      // use this category - show that message rather than a generic error.
      .catch((err) => { setError(parseError(err).message); setTarget(null) })
      .finally(() => setBusy(false))
  }

  const columns = [
    { key: 'categoryName', header: 'Category', render: (c) => <span className="cell-strong">{c.categoryName}</span> },
    { key: 'description', header: 'Description' },
    { key: 'seatingCapacity', header: 'Seats', align: 'right' },
    { key: 'dailyRate', header: 'Daily Rate', align: 'right', render: (c) => money(c.dailyRate) },
  ]

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Vehicle Categories</h1>
          <p>Vehicle types and the daily rate used to price bookings.</p>
        </div>
        <Link to="/staff/categories/new" className="btn btn-primary">+ Add Category</Link>
      </div>

      <Alert kind="error" onClose={() => setError('')}>{error}</Alert>
      <Alert kind="success" onClose={() => setNotice('')}>{notice}</Alert>

      <div className="card">
        <div className="card-head">
          <div className="toolbar">
            <input
              className="input grow"
              placeholder="Search categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="cell-sub">{rows.length} vehicle type{rows.length === 1 ? '' : 's'}</span>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          rowKey={(c) => c.categoryId}
          emptyTitle={search ? 'No matches' : 'No categories yet'}
          emptyText={search ? 'Try a different name.' : 'Add Car, Van, SUV and so on to get started.'}
          actions={(c) => (
            <>
              <button className="btn-link" onClick={() => navigate(`/staff/categories/${c.categoryId}/edit`)}>Edit</button>
              <button className="btn-link danger" onClick={() => setTarget(c)}>Delete</button>
            </>
          )}
        />
      </div>

      <ConfirmDialog
        open={!!target}
        busy={busy}
        title="Delete category?"
        message={`This will remove ${target?.categoryName}. A category still used by vehicles cannot be deleted.`}
        onConfirm={confirmDelete}
        onCancel={() => setTarget(null)}
      />
    </>
  )
}
