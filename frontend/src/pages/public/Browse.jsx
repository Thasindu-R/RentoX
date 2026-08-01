import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  categoryApi, money, parseError, vehicleApi, vehicleImageUrl,
} from '../../api.js'
import { Alert } from '../../components/FormField.jsx'

/** Shown when a vehicle has no uploaded photo. */
function PhotoPlaceholder() {
  return (
    <div className="vehicle-photo placeholder">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 17H3v-5l2-5h11l3 5h1a1 1 0 0 1 1 1v4h-2M5 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0M15 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0M9 17h6" />
      </svg>
      <span>No photo yet</span>
    </div>
  )
}

function VehicleCard({ vehicle, onRent }) {
  const img = vehicleImageUrl(vehicle)
  const rate = vehicle.category?.dailyRate
  const rentable = vehicle.status === 'AVAILABLE'

  return (
    <article className="vehicle-card">
      {img
        ? <img className="vehicle-photo" src={img} alt={`${vehicle.brand} ${vehicle.model}`} loading="lazy" />
        : <PhotoPlaceholder />}

      <div className="vehicle-body">
        <div className="vehicle-head">
          <div>
            <h3>{vehicle.brand} {vehicle.model}</h3>
            <div className="cell-sub">
              {vehicle.category?.categoryName}
              {vehicle.year ? ` · ${vehicle.year}` : ''}
            </div>
          </div>
          <span className={'badge ' + (rentable ? 'badge-green' : 'badge-grey')}>
            {rentable ? 'Available' : vehicle.status === 'RENTED' ? 'Rented out' : 'Unavailable'}
          </span>
        </div>

        <ul className="vehicle-specs">
          {vehicle.category?.seatingCapacity && <li>{vehicle.category.seatingCapacity} seats</li>}
          {vehicle.transmission && <li>{vehicle.transmission.toLowerCase()}</li>}
          {vehicle.fuelType && <li>{vehicle.fuelType.toLowerCase()}</li>}
        </ul>

        <div className="vehicle-foot">
          <div>
            <div className="vehicle-price">{rate != null ? money(rate) : '—'}</div>
            <div className="cell-sub">per day</div>
          </div>
          <button
            className="btn btn-primary"
            disabled={!rentable}
            onClick={() => onRent(vehicle)}
            title={rentable ? 'Rent this vehicle' : 'This vehicle is not available'}
          >
            {rentable ? 'Rent this car' : 'Unavailable'}
          </button>
        </div>
      </div>
    </article>
  )
}

/**
 * The public landing page. No account needed - anyone can browse the fleet and
 * see the daily rates. Clicking "Rent this car" is the point where an account
 * becomes necessary, and a visitor without one is sent to sign up.
 */
export default function Browse({ customer }) {
  const [vehicles, setVehicles] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [onlyAvailable, setOnlyAvailable] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const request = search.trim()
      ? vehicleApi.search(search.trim())
      : vehicleApi.list({ categoryId })
    const t = setTimeout(() => {
      request
        .then((data) => { setVehicles(data); setError('') })
        .catch((err) => setError(parseError(err).message))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [search, categoryId])

  const visible = useMemo(
    () => (onlyAvailable ? vehicles.filter((v) => v.status === 'AVAILABLE') : vehicles),
    [vehicles, onlyAvailable]
  )

  /** The redirect the brief asks for: no account -> sign up first. */
  const handleRent = (vehicle) => {
    if (!customer) {
      navigate('/signup', { state: { redirectTo: `/rent/${vehicle.vehicleId}` } })
      return
    }
    navigate(`/rent/${vehicle.vehicleId}`)
  }

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <h1>Rent a vehicle across Sri Lanka</h1>
          <p>
            Browse the fleet and see our daily rates.
          </p>
          {!customer && (
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary">Create an account</Link>
              <Link to="/login" className="btn btn-secondary">Sign in</Link>
            </div>
          )}
        </div>
      </section>

      <div className="site-content">
        <Alert kind="error" onClose={() => setError('')}>{error}</Alert>

        <div className="browse-toolbar">
          <input
            className="input grow"
            placeholder="Search by brand, model or registration…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                  disabled={!!search.trim()}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
            ))}
          </select>
          <label className="check" style={{ whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
            <span>Available only</span>
          </label>
        </div>

        {loading ? (
          <div className="state"><div className="spinner" /><div style={{ marginTop: 10 }}>Loading vehicles…</div></div>
        ) : visible.length === 0 ? (
          <div className="state">
            <div className="state-icon">◻</div>
            <div className="state-title">No vehicles match</div>
            <div>Try a different search, or clear the filters.</div>
          </div>
        ) : (
          <>
            <div className="cell-sub" style={{ marginBottom: 12 }}>
              {visible.length} vehicle{visible.length === 1 ? '' : 's'}
            </div>
            <div className="vehicle-grid">
              {visible.map((v) => (
                <VehicleCard key={v.vehicleId} vehicle={v} onRent={handleRent} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
