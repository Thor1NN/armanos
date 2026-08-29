import { notFound } from 'next/navigation'

/**
 * V1: the public share-link feature is disabled. The route 404s
 * unconditionally; server-side share-token access has also been removed from
 * every log collection, so a leaked historical link exposes nothing.
 * The `share-links` collection is retained (hidden) so re-enabling later is a
 * revert, not a rebuild.
 */
export default function SharePage() {
  notFound()
}
