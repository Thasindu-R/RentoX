import { parseError } from '../../api.js'

/**
 * Customers say whether they want a driver, not which one - they have no way of
 * knowing the roster. Both public booking forms offer the same two options.
 */
export const DRIVER_CHOICES = [
  { value: 'SELF', label: 'Self Drive' },
  { value: 'DRIVER', label: 'Driver Required' },
]

/** Which of the two an existing booking represents. */
export function choiceFor(booking) {
  return booking?.driver ? 'DRIVER' : 'SELF'
}

/**
 * Saves a booking for the chosen option, resolving "Driver Required" to an
 * actual driver.
 *
 * Whether a driver is free depends on the dates, and only the server knows the
 * clashes, so each available driver is offered in turn until one is accepted.
 * Anything that is not a driver clash - an unavailable vehicle, say - fails on
 * the first attempt instead of being retried against the whole roster.
 *
 * @param save     function taking the payload, e.g. bookingApi.create
 * @param payload  the booking, without driverId
 * @param choice   'SELF' or 'DRIVER'
 * @param drivers  drivers the server currently lists as available
 */
export async function saveWithDriverChoice(save, payload, choice, drivers) {
  if (choice !== 'DRIVER') {
    return save({ ...payload, driverId: null })
  }

  if (!drivers || drivers.length === 0) {
    throw new Error('No drivers are available at the moment. Choose Self Drive, or contact us.')
  }

  for (const driver of drivers) {
    try {
      return await save({ ...payload, driverId: driver.driverId })
    } catch (err) {
      if (!/driver/i.test(parseError(err).message)) throw err
    }
  }

  // Everyone on the roster clashes with these dates. The server's message names
  // whichever driver was tried last, which would be a stranger to the customer -
  // they asked for a driver, not for anyone in particular.
  throw new Error('No driver is free for those dates. Try different dates, or choose Self Drive.')
}
