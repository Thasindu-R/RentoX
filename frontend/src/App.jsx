import { useCallback, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import Navbar from './components/Navbar.jsx'
import PublicHeader from './components/PublicHeader.jsx'

// Public site
import Browse from './pages/public/Browse.jsx'
import Signup from './pages/public/Signup.jsx'
import CustomerLogin from './pages/public/CustomerLogin.jsx'
import RentForm from './pages/public/RentForm.jsx'
import MyBookings from './pages/public/MyBookings.jsx'

// Staff area
import Dashboard from './pages/Dashboard.jsx'
import CustomerList from './pages/customers/CustomerList.jsx'
import CustomerForm from './pages/customers/CustomerForm.jsx'
import CategoryList from './pages/categories/CategoryList.jsx'
import CategoryForm from './pages/categories/CategoryForm.jsx'
import VehicleList from './pages/vehicles/VehicleList.jsx'
import VehicleForm from './pages/vehicles/VehicleForm.jsx'
import DriverList from './pages/drivers/DriverList.jsx'
import DriverForm from './pages/drivers/DriverForm.jsx'
import BookingList from './pages/bookings/BookingList.jsx'
import BookingForm from './pages/bookings/BookingForm.jsx'
import BookingDetail from './pages/bookings/BookingDetail.jsx'
import PaymentList from './pages/payments/PaymentList.jsx'
import PaymentForm from './pages/payments/PaymentForm.jsx'

const STAFF_KEY = 'rentox.staff'
const CUSTOMER_KEY = 'rentox.customer'

/**
 * Two separate sessions, both kept in localStorage:
 *
 *   customer - a real account created through /signup. The backend checks the
 *              password against a BCrypt hash.
 *   staff    - the single hardcoded admin account from the project scope,
 *              checked in the browser.
 *
 * Both are entered through the same form at /login, which decides which of the
 * two a given set of credentials belongs to and routes accordingly.
 *
 * Neither is real security: the API itself is unauthenticated, so these only
 * decide what the UI shows. Locking the API down would mean adding Spring
 * Security, which is outside the project scope.
 */
export default function App() {
  const [customer, setCustomer] = useState(() => {
    const raw = localStorage.getItem(CUSTOMER_KEY)
    return raw ? JSON.parse(raw) : null
  })
  const [staff, setStaff] = useState(() => localStorage.getItem(STAFF_KEY))
  const location = useLocation()

  const loginCustomer = useCallback((c) => {
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(c))
    setCustomer(c)
  }, [])

  const logoutCustomer = useCallback(() => {
    localStorage.removeItem(CUSTOMER_KEY)
    setCustomer(null)
  }, [])

  const loginStaff = useCallback((name) => {
    localStorage.setItem(STAFF_KEY, name)
    setStaff(name)
  }, [])

  const logoutStaff = useCallback(() => {
    localStorage.removeItem(STAFF_KEY)
    setStaff(null)
  }, [])

  /* ---------------- Staff area: /staff/** ---------------- */
  if (location.pathname.startsWith('/staff')) {
    // Not signed in as admin: there is no separate staff form to fall back to,
    // so send them to the one public sign-in page.
    if (!staff) {
      return (
        <Routes>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )
    }
    return (
      <Navbar user={staff} onLogout={logoutStaff}>
        <Routes>
          <Route path="/staff" element={<Dashboard />} />

          {/* No "new customer" route - customers sign up themselves. */}
          <Route path="/staff/customers" element={<CustomerList />} />
          <Route path="/staff/customers/:id/edit" element={<CustomerForm />} />

          <Route path="/staff/categories" element={<CategoryList />} />
          <Route path="/staff/categories/new" element={<CategoryForm />} />
          <Route path="/staff/categories/:id/edit" element={<CategoryForm />} />

          <Route path="/staff/vehicles" element={<VehicleList />} />
          <Route path="/staff/vehicles/new" element={<VehicleForm />} />
          <Route path="/staff/vehicles/:id/edit" element={<VehicleForm />} />

          <Route path="/staff/drivers" element={<DriverList />} />
          <Route path="/staff/drivers/new" element={<DriverForm />} />
          <Route path="/staff/drivers/:id/edit" element={<DriverForm />} />

          {/* No "new booking" route - customers book for themselves. */}
          <Route path="/staff/bookings" element={<BookingList />} />
          <Route path="/staff/bookings/:id" element={<BookingDetail />} />
          <Route path="/staff/bookings/:id/edit" element={<BookingForm />} />

          <Route path="/staff/payments" element={<PaymentList />} />
          <Route path="/staff/payments/new" element={<PaymentForm />} />
          <Route path="/staff/payments/:id/edit" element={<PaymentForm />} />

          <Route path="*" element={<Navigate to="/staff" replace />} />
        </Routes>
      </Navbar>
    )
  }

  /* ---------------- Public site ---------------- */
  return (
    <PublicHeader customer={customer} onLogout={logoutCustomer}>
      <Routes>
        {/* Anyone can browse the fleet and see prices without an account. */}
        <Route path="/" element={<Browse customer={customer} />} />
        <Route path="/signup" element={<Signup onLogin={loginCustomer} customer={customer} />} />
        {/* Admins sign in here too - the form routes them to /staff. */}
        <Route
          path="/login"
          element={
            <CustomerLogin
              onLogin={loginCustomer}
              onStaffLogin={loginStaff}
              customer={customer}
              staff={staff}
            />
          }
        />

        {/* Renting requires an account - RentForm redirects to /signup itself. */}
        <Route path="/rent/:vehicleId" element={<RentForm customer={customer} />} />
        <Route path="/my-bookings" element={<MyBookings customer={customer} />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PublicHeader>
  )
}
