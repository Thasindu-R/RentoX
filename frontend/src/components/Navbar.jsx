import { NavLink, useLocation, useNavigate } from 'react-router-dom'

/**
 * Inline SVG icons. Drawn from the same 24x24 grid with the same stroke
 * width, so every item in the sidebar lines up - unlike text glyphs, which
 * each have their own width and weight.
 */
const PATHS = {
  dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  customers: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87',
  categories: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  vehicles: 'M5 17H3v-5l2-5h11l3 5h1a1 1 0 0 1 1 1v4h-2M5 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0M15 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0M9 17h6',
  drivers: 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0',
  bookings: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  payments: 'M2 7h20v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1zM2 7l2-3h16l2 3M12 12v4M9 14h6',
}

function Icon({ name }) {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  )
}

const NAV = [
  { to: '/staff', label: 'Dashboard', icon: 'dashboard', end: true },
  { section: 'Records' },
  { to: '/staff/customers', label: 'Customers', icon: 'customers' },
  { to: '/staff/categories', label: 'Categories', icon: 'categories' },
  { to: '/staff/vehicles', label: 'Vehicles', icon: 'vehicles' },
  { to: '/staff/drivers', label: 'Drivers', icon: 'drivers' },
  { section: 'Operations' },
  { to: '/staff/bookings', label: 'Bookings', icon: 'bookings' },
  { to: '/staff/payments', label: 'Payments', icon: 'payments' },
]

/** Page title shown in the top bar, derived from the current URL. */
function titleFor(pathname) {
  if (pathname === '/staff') return 'Dashboard'
  const seg = pathname.split('/')[2] || ''
  const item = NAV.find((n) => n.to === '/staff/' + seg)
  return item ? item.label : 'RentoX'
}

export default function Navbar({ children, user, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()

  const logout = () => {
    onLogout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">R</div>
          <div>
            <div className="brand-name">RentoX</div>
            <div className="brand-sub">Vehicle Rental</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item, i) =>
            item.section ? (
              <div className="nav-section" key={'s' + i}>
                {item.section}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
              >
                <Icon name={item.icon} />
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <a href="/" className="btn btn-secondary btn-sm" style={{ width: '100%', marginBottom: 8 }}>
            View public site
          </a>
          <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-title">{titleFor(location.pathname)}</div>
          <div className="topbar-user">
            <span>{user}</span>
            <div className="avatar">{(user || 'A').slice(0, 1).toUpperCase()}</div>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
