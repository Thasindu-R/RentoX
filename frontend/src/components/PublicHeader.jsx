import { Link, NavLink, useNavigate } from 'react-router-dom'

/**
 * Header for the public site. Deliberately different from the staff sidebar:
 * a visitor should feel they are on a rental website, not an admin tool.
 *
 * The whole public site is browsable without an account - only the sign-in
 * state of the right-hand side changes.
 */
export default function PublicHeader({ customer, onLogout, children }) {
  const navigate = useNavigate()

  const logout = () => {
    onLogout()
    navigate('/', { replace: true })
  }

  return (
    <div className="site">
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="site-brand">
            <span className="brand-mark">R</span>
            <span>
              <span className="brand-name">RentoX</span>
              <span className="brand-sub">Vehicle Rental</span>
            </span>
          </Link>

          <nav className="site-nav">
            <NavLink to="/" end className={({ isActive }) => 'site-link' + (isActive ? ' active' : '')}>
              Browse Vehicles
            </NavLink>
            {customer && (
              <NavLink to="/my-bookings" className={({ isActive }) => 'site-link' + (isActive ? ' active' : '')}>
                My Bookings
              </NavLink>
            )}
          </nav>

          <div className="site-actions">
            {customer ? (
              <>
                <span className="site-user">
                  <span className="avatar">{(customer.fullName || 'C').slice(0, 1).toUpperCase()}</span>
                  <span className="site-user-name">{customer.fullName}</span>
                </span>
                <button className="btn btn-secondary btn-sm" onClick={logout}>Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary btn-sm">Sign in</Link>
                <Link to="/signup" className="btn btn-primary btn-sm">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="site-main">{children}</main>

      <footer className="site-footer">
        <span>RentoX — Vehicle Rental Management System</span>
        <a href="/staff">Staff login</a>
      </footer>
    </div>
  )
}
