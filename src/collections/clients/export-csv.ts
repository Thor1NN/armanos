import type { PayloadRequest } from 'payload'

const CSV_HEADER = [
  'date',
  'session_title',
  'exercise',
  'set_number',
  'weight_left_kg',
  'weight_right_kg',
  'bodyweight',
  'reps_left',
  'reps_right',
  'rir',
  'distance_m',
  'duration_sec',
  'set_note',
  'completed_at_utc',
]

const csvCell = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

/**
 * Exports one client's full workout history as CSV (admin only).
 * GET /api/clients/:id/export
 */
export const exportCsvHandler = async (req: PayloadRequest) => {
  if (req.user?.collection !== 'users') {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const id = req.routeParams?.id
  if (!id) return Response.json({ message: 'Client id is required.' }, { status: 400 })

  const client = await req.payload.findByID({ collection: 'clients', id: String(id), depth: 0 })

  const sessions = await req.payload.find({
    collection: 'workout-logs',
    where: { client: { equals: client.id } },
    sort: 'startedAt',
    depth: 0,
    limit: 10000,
    pagination: false,
  })
  const sessionById = new Map(sessions.docs.map((doc) => [doc.id, doc]))

  const sets = await req.payload.find({
    collection: 'set-logs',
    where: { client: { equals: client.id } },
    sort: 'completedAt',
    depth: 0,
    limit: 100000,
    pagination: false,
  })

  const lines = [CSV_HEADER.join(',')]
  for (const set of sets.docs) {
    const sessionId = typeof set.session === 'object' ? set.session?.id : set.session
    const session = sessionId ? sessionById.get(sessionId) : undefined
    const date = session?.startedAt ?? session?.createdAt ?? set.completedAt ?? ''
    lines.push(
      [
        csvCell(date ? String(date).slice(0, 10) : ''),
        csvCell(session?.title),
        csvCell(set.exerciseName),
        csvCell(set.setNumber),
        csvCell(set.weightLeft),
        csvCell(set.weightRight),
        csvCell(set.isBodyweight ? 'yes' : ''),
        csvCell(set.repsLeft),
        csvCell(set.repsRight),
        csvCell(set.rir),
        csvCell(set.distanceM),
        csvCell(set.durationSec),
        csvCell(set.note),
        csvCell(set.completedAt),
      ].join(','),
    )
  }

  const slug = (client.name || client.email || `client-${client.id}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
  return new Response(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}-workout-history.csv"`,
    },
  })
}
