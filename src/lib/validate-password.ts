import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

// NIST SP 800-63B: favour length over composition rules. 15+ characters.
const MIN_PASSWORD_LENGTH = 15

/**
 * `beforeValidate` hook for auth collections. Enforces a minimum password
 * length. Payload exposes the plaintext password on `data.password` during
 * create and password changes; it is absent on ordinary updates, so this is a
 * no-op then.
 */
export const validatePassword: CollectionBeforeValidateHook = async ({ data }) => {
  const password = (data as { password?: unknown } | undefined)?.password
  if (typeof password !== 'string' || password.length === 0) return data

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new APIError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`, 400)
  }

  return data
}
