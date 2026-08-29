import { APIError, type PayloadRequest } from 'payload'

/**
 * Server-side integrity checks shared by the log collections
 * (`set-logs`, `exercise-logs`, `round-logs`).
 *
 * Ownership is always derived from the authenticated session — client-supplied
 * IDs are never trusted.
 */

/**
 * For client users: verifies the referenced session (`workout-logs` doc)
 * belongs to the caller and has not been completed yet.
 * Admins (collection `users`) bypass the check.
 */
export async function assertWritableOwnSession(
  req: PayloadRequest,
  sessionId: number | string | null | undefined,
): Promise<void> {
  if (req.user?.collection !== 'clients' || !sessionId) return

  const session = await req.payload.findByID({
    collection: 'workout-logs',
    id: sessionId,
    depth: 0,
    req,
  })
  const owner = typeof session.client === 'object' ? session.client?.id : session.client
  if (owner !== req.user.id) {
    throw new APIError('You cannot write to someone else\'s session.', 403)
  }
  if (session.completedAt) {
    throw new APIError('This workout is already completed and can no longer be edited.', 400)
  }
}

const isNil = (value: unknown): value is null | undefined => value === null || value === undefined

/** Non-negative number (weights, distances, durations). */
export const validateNonNegative = (value: unknown): true | string => {
  if (isNil(value) || value === '') return true
  const num = Number(value)
  if (!Number.isFinite(num) || num < 0) return 'Must be a non-negative number.'
  return true
}

/** Non-negative number on a 0.25 step (canonical weight unit: kg). */
export const validateWeight = (value: unknown): true | string => {
  const base = validateNonNegative(value)
  if (base !== true) return base
  if (isNil(value) || value === '') return true
  const num = Number(value)
  if (Math.round(num * 4) !== num * 4) return 'Weight must be in 0.25 kg steps.'
  return true
}

/** Non-negative integer (reps, set numbers, seconds). Accepts numeric strings. */
export const validateNonNegativeInt = (value: unknown): true | string => {
  if (isNil(value) || value === '') return true
  const num = Number(value)
  if (!Number.isInteger(num) || num < 0) return 'Must be a non-negative whole number.'
  return true
}

/** Positive integer (set numbers start at 1). */
export const validateSetNumber = (value: unknown): true | string => {
  if (isNil(value)) return true
  const num = Number(value)
  if (!Number.isInteger(num) || num < 1) return 'Set number must be a whole number of 1 or more.'
  return true
}

/** RIR: number between 0 and 10 (0.5 steps allowed). Stored as text for legacy reasons. */
export const validateRir = (value: unknown): true | string => {
  if (isNil(value) || value === '') return true
  const num = Number(String(value).replace(',', '.'))
  if (!Number.isFinite(num) || num < 0 || num > 10) return 'RIR must be between 0 and 10.'
  if (Math.round(num * 2) !== num * 2) return 'RIR must be in 0.5 steps.'
  return true
}
