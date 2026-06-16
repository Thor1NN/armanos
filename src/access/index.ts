import type { Access, FieldAccess, Where } from 'payload'

/** Whether the logged-in user is a staff member/admin (collection `users`). */
export const isAdmin: Access = ({ req: { user } }) => user?.collection === 'users'

/** Field-level access version (returns boolean). */
export const isAdminField: FieldAccess = ({ req: { user } }) => user?.collection === 'users'

/** Any authenticated user (admin or client) can read. */
export const isAuthenticated: Access = ({ req: { user } }) => Boolean(user)

/**
 * Admin sees everything; a client sees only their own record (by the `id` field).
 * Used for the `clients` collection.
 */
export const adminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.collection === 'users') return true
  return { id: { equals: user.id } }
}

/**
 * Admin sees everything; a client sees only documents where the `client` field
 * points to them. Used for `workout-logs` and `assignments`.
 */
export const adminOrOwnByClient: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.collection === 'users') return true
  return { client: { equals: user.id } }
}

/** @deprecated alias kept for readability in workout-logs */
export const adminOrOwnLogs = adminOrOwnByClient

/**
 * Allows read access when the request carries a valid `share-token` cookie
 * pointing to a share-link that has the `'results'` permission.
 * Returns a `{ client: { equals: clientId } }` constraint so Payload scopes
 * the results to the plan owner's logs only.
 */
export const canReadViaShareToken = async ({
  req,
}: Parameters<Access>[0]): Promise<boolean | Where> => {
  const cookieHeader = req.headers.get('cookie') ?? ''
  const token = cookieHeader
    .split(';')
    .map((c) => c.trim().split('='))
    .find(([k]) => k === 'share-token')?.[1]
  if (!token) return false

  const result = await req.payload.find({
    collection: 'share-links',
    where: {
      token: { equals: token },
      active: { equals: true },
      expiresAt: { greater_than: new Date().toISOString() },
    },
    depth: 2,
    limit: 1,
    overrideAccess: true,
  })

  const link = result.docs[0]
  if (!link) return false

  const permissions = (link.permissions ?? []) as string[]
  if (!permissions.includes('results')) return false

  const plan = typeof link.plan === 'object' ? link.plan : null
  const rawClient = plan?.client
  const clientId =
    rawClient && typeof rawClient === 'object'
      ? (rawClient as { id: number | string }).id
      : (rawClient as number | string | undefined)

  if (!clientId) return false
  return { client: { equals: clientId } }
}
