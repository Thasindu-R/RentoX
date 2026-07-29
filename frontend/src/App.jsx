import { useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import Navbar from './components/Navbar.jsx'
import Login from './pages/Login.jsx'
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

const SESSION_KEY = 'rentox.user'

export default function App() {
  // The proposal asks for a single hardcoded staff login, so the "session" is
  // just a username kept in localStorage. This is NOT real security - anyone
  // can call the API directly. Adding Spring Security is out of scope.
  const [user, setUser] = useState(() => localStorage.getItem(SESSION_KEY))
  const location = useLocation()

  const login = (username) => {
    localStorage.setItem(SESSION_KEY, username)
    setUser(username)
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="*" element={<Navigate to="/login" replace state={{ from: location.pathname }} />} />
      </Routes>
    )
  }

  return (
    <Navbar user={user} onLogout={logout}>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/" element={<Dashboard />} />

        <Route path="/customers" element={<CustomerList />} />
        <Route path="/customers/new" element={<CustomerForm />} />
        <Route path="/customers/:id/edit" element={<CustomerForm />} />

        <Route path="/categories" element={<CategoryList />} />
        <Route path="/categories/new" element={<CategoryForm />} />
        <Route path="/categories/:id/edit" element={<CategoryForm />} />

        <Route path="/vehicles" element={<VehicleList />} />
        <Route path="/vehicles/new" element={<VehicleForm />} />
        <Route path="/vehicles/:id/edit" element={<VehicleForm />} />

        <Route path="/drivers" element={<DriverList />} />
        <Route path="/drivers/new" element={<DriverForm />} />
        <Route path="/drivers/:id/edit" element={<DriverForm />} />

        <Route path="/bookings" element={<BookingList />} />
        <Route path="/bookings/new" element={<BookingForm />} />
        <Route path="/bookings/:id" element={<BookingDetail />} />
        <Route path="/bookings/:id/edit" element={<BookingForm />} />

        <Route path="/payments" element={<PaymentList />} />
        <Route path="/payments/new" element={<PaymentForm />} />
        <Route path="/payments/:id/edit" element={<PaymentForm />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Navbar>
  )
}
