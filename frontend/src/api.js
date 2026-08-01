import axios from 'axios'

/**
 * One Axios instance for the whole app. Every module imports from here, so the
 * backend URL is written down exactly once.
 */
const http = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
})

/**
 * Turns whatever the backend threw into a message we can show the user.
 *
 * GlobalExceptionHandler always replies in the same shape:
 *   { timestamp, status, error, message, fieldErrors? }
 *
 * Returns { message, fieldErrors } so a form can show the general message at
 * the top and the per-field ones under each input.
 */
export function parseError(err) {
  const data = err?.response?.data
  if (data?.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
    return {
      message: data.message || 'Please correct the highlighted fields.',
      fieldErrors: data.fieldErrors,
    }
  }
  if (data?.message) {
    return { message: data.message, fieldErrors: {} }
  }
  if (err?.code === 'ERR_NETWORK') {
    return {
      message: 'Cannot reach the server. Is the Spring Boot backend running on port 8080?',
      fieldErrors: {},
    }
  }
  return { message: err?.message || 'Something went wrong.', fieldErrors: {} }
}

const body = (res) => res.data

/** Where the Spring Boot server lives, for images served outside /api. */
export const SERVER_URL = 'http://localhost:8080'

/**
 * Full URL of a vehicle photo, or null when the vehicle has none.
 * The backend stores only the file name and serves the file from /uploads.
 */
export function vehicleImageUrl(vehicle) {
  return vehicle?.imagePath ? `${SERVER_URL}/uploads/${vehicle.imagePath}` : null
}

/** Same folder, same arrangement - customers keep a photo too. */
export function customerImageUrl(customer) {
  return customer?.imagePath ? `${SERVER_URL}/uploads/${customer.imagePath}` : null
}

/* ------------------------------------------------------------------ */
/*  Public authentication - customers only                            */
/* ------------------------------------------------------------------ */
export const authApi = {
  signup: (data) => http.post('/auth/signup', data).then(body),
  login: (data) => http.post('/auth/login', data).then(body),
}

/* ------------------------------------------------------------------ */
/*  Module 1 - Customers                                              */
/* ------------------------------------------------------------------ */
export const customerApi = {
  list: (search) => http.get('/customers', { params: search ? { search } : {} }).then(body),
  get: (id) => http.get(`/customers/${id}`).then(body),
  // No create() on purpose - customers sign up via authApi.signup.
  update: (id, data) => http.put(`/customers/${id}`, data).then(body),
  /** Multipart, like the vehicle one - see vehicleApi.uploadPhoto. */
  uploadPhoto: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return http.post(`/customers/${id}/photo`, form, {
      headers: { 'Content-Type': undefined },
    }).then(body)
  },
  removePhoto: (id) => http.delete(`/customers/${id}/photo`).then(body),
  remove: (id) => http.delete(`/customers/${id}`).then(body),
  count: () => http.get('/customers/count').then(body),
}

/* ------------------------------------------------------------------ */
/*  Module 2 - Categories                                             */
/* ------------------------------------------------------------------ */
export const categoryApi = {
  list: (search) => http.get('/categories', { params: search ? { search } : {} }).then(body),
  get: (id) => http.get(`/categories/${id}`).then(body),
  create: (data) => http.post('/categories', data).then(body),
  update: (id, data) => http.put(`/categories/${id}`, data).then(body),
  remove: (id) => http.delete(`/categories/${id}`).then(body),
  count: () => http.get('/categories/count').then(body),
}

/* ------------------------------------------------------------------ */
/*  Module 3 - Vehicles                                               */
/* ------------------------------------------------------------------ */
export const vehicleApi = {
  /** Filtering and free-text search are different endpoints on the backend. */
  list: ({ categoryId, status } = {}) => {
    const params = {}
    if (categoryId) params.categoryId = categoryId
    if (status) params.status = status
    return http.get('/vehicles', { params }).then(body)
  },
  search: (q) => http.get('/vehicles/search', { params: { q } }).then(body),
  get: (id) => http.get(`/vehicles/${id}`).then(body),
  create: (data) => http.post('/vehicles', data).then(body),
  update: (id, data) => http.put(`/vehicles/${id}`, data).then(body),
  setStatus: (id, status) => http.patch(`/vehicles/${id}/status`, null, { params: { status } }).then(body),
  /**
   * Photo upload. FormData - not JSON - because a file cannot be sent as JSON.
   * Axios sets the multipart Content-Type (with its boundary) automatically,
   * so we clear the instance's application/json header for this one call.
   */
  uploadPhoto: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return http.post(`/vehicles/${id}/photo`, form, {
      headers: { 'Content-Type': undefined },
    }).then(body)
  },
  removePhoto: (id) => http.delete(`/vehicles/${id}/photo`).then(body),
  remove: (id) => http.delete(`/vehicles/${id}`).then(body),
  count: (status) => http.get('/vehicles/count', { params: status ? { status } : {} }).then(body),
}

/* ------------------------------------------------------------------ */
/*  Module 4 - Drivers                                                */
/* ------------------------------------------------------------------ */
export const driverApi = {
  list: (available) =>
    http.get('/drivers', { params: available === undefined || available === '' ? {} : { available } }).then(body),
  search: (q) => http.get('/drivers/search', { params: { q } }).then(body),
  get: (id) => http.get(`/drivers/${id}`).then(body),
  create: (data) => http.post('/drivers', data).then(body),
  update: (id, data) => http.put(`/drivers/${id}`, data).then(body),
  setAvailability: (id, available) =>
    http.patch(`/drivers/${id}/availability`, null, { params: { available } }).then(body),
  remove: (id) => http.delete(`/drivers/${id}`).then(body),
  count: () => http.get('/drivers/count').then(body),
}

/* ------------------------------------------------------------------ */
/*  Module 5 - Bookings                                               */
/* ------------------------------------------------------------------ */
export const bookingApi = {
  list: ({ status, from, to } = {}) => {
    const params = {}
    if (status) params.status = status
    if (from && to) { params.from = from; params.to = to }
    return http.get('/bookings', { params }).then(body)
  },
  get: (id) => http.get(`/bookings/${id}`).then(body),
  byCustomer: (customerId) => http.get(`/bookings/customer/${customerId}`).then(body),
  byVehicle: (vehicleId) => http.get(`/bookings/vehicle/${vehicleId}`).then(body),
  create: (data) => http.post('/bookings', data).then(body),
  update: (id, data) => http.put(`/bookings/${id}`, data).then(body),
  setStatus: (id, status) => http.patch(`/bookings/${id}/status`, null, { params: { status } }).then(body),
  remove: (id) => http.delete(`/bookings/${id}`).then(body),
  count: (status) => http.get('/bookings/count', { params: status ? { status } : {} }).then(body),
}

/* ------------------------------------------------------------------ */
/*  Module 6 - Payments                                               */
/* ------------------------------------------------------------------ */
export const paymentApi = {
  list: () => http.get('/payments').then(body),
  get: (id) => http.get(`/payments/${id}`).then(body),
  byBooking: (bookingId) => http.get(`/payments/booking/${bookingId}`).then(body),
  balance: (bookingId) => http.get(`/payments/booking/${bookingId}/balance`).then(body),
  create: (data) => http.post('/payments', data).then(body),
  update: (id, data) => http.put(`/payments/${id}`, data).then(body),
  remove: (id) => http.delete(`/payments/${id}`).then(body),
  count: () => http.get('/payments/count').then(body),
}

/* ------------------------------------------------------------------ */
/*  Shared option lists - these mirror the CHECK constraints in the    */
/*  SQL schema and the ALLOWED_* sets in the services.                 */
/* ------------------------------------------------------------------ */
export const VEHICLE_STATUSES = ['AVAILABLE', 'RENTED', 'MAINTENANCE']
export const FUEL_TYPES = ['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC']
export const TRANSMISSIONS = ['MANUAL', 'AUTOMATIC']
export const BOOKING_STATUSES = ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED']
export const PAYMENT_METHODS = ['CASH', 'CARD', 'BANK_TRANSFER']
export const PAYMENT_TYPES = ['ADVANCE', 'FULL', 'BALANCE']

/** Rupee formatting used by every table and summary. */
export function money(value) {
  const n = Number(value ?? 0)
  return 'Rs. ' + n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Maps a status string to one of the badge classes in styles.css. */
export function statusClass(status) {
  switch (status) {
    case 'AVAILABLE':
    case 'COMPLETED':
      return 'badge badge-green'
    case 'RENTED':
    case 'ACTIVE':
      return 'badge badge-blue'
    case 'MAINTENANCE':
    case 'PENDING':
      return 'badge badge-amber'
    case 'CANCELLED':
      return 'badge badge-red'
    default:
      return 'badge badge-grey'
  }
}

export default http
