import type { Access, FieldAccess } from 'payload'

/** Czy zalogowany użytkownik to pracownik/admin (kolekcja `users`). */
export const isAdmin: Access = ({ req: { user } }) => user?.collection === 'users'

/** Wersja dla dostępu na poziomie pola (zwraca boolean). */
export const isAdminField: FieldAccess = ({ req: { user } }) => user?.collection === 'users'

/** Każdy zalogowany (admin lub klient) może czytać. */
export const isAuthenticated: Access = ({ req: { user } }) => Boolean(user)

/**
 * Admin widzi wszystko; klient tylko własny rekord (po polu `id`).
 * Używane dla kolekcji `clients`.
 */
export const adminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.collection === 'users') return true
  return { id: { equals: user.id } }
}

/**
 * Admin widzi wszystko; klient tylko dokumenty, gdzie pole `client`
 * wskazuje na niego. Używane dla `workout-logs` i `assignments`.
 */
export const adminOrOwnByClient: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.collection === 'users') return true
  return { client: { equals: user.id } }
}

/** @deprecated alias zachowany dla czytelności w workout-logs */
export const adminOrOwnLogs = adminOrOwnByClient
