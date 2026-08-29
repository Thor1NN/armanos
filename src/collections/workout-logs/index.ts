import { APIError, type CollectionConfig, type PayloadRequest } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { adminOrOwnByClient } from '../../access'

type DrizzleExecutor = {
  drizzle: { execute: (query: unknown) => Promise<{ rows?: unknown[] }> }
}

/**
 * Marks a session as completed. Atomic and idempotent: a single SQL UPDATE
 * with COALESCE, so double submissions (double-tap, retry after a lost
 * response) can never produce a second completion or shift the timestamp.
 */
const finishHandler = async (req: PayloadRequest) => {
  if (!req.user) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const id = Number(req.routeParams?.id)
  if (!Number.isInteger(id)) {
    return Response.json({ message: 'Invalid session id.' }, { status: 400 })
  }

  const ownerClause =
    req.user.collection === 'clients' ? sql` AND client_id = ${req.user.id}` : sql``

  const drizzle = (req.payload.db as unknown as DrizzleExecutor).drizzle
  const result = await drizzle.execute(sql`
    UPDATE workout_logs
    SET completed_at = COALESCE(completed_at, now()),
        finished_at = COALESCE(finished_at, now()),
        updated_at = now()
    WHERE id = ${id}${ownerClause}
    RETURNING id
  `)
  const rows = (result as { rows?: unknown[] }).rows ?? []
  if (!rows.length) {
    return Response.json({ message: 'Session not found.' }, { status: 404 })
  }

  const doc = await req.payload.findByID({
    collection: 'workout-logs',
    id,
    depth: 0,
    req,
    overrideAccess: false,
    user: req.user,
  })
  return Response.json({ doc }, { status: 200 })
}

export const WorkoutLogs: CollectionConfig = {
  slug: 'workout-logs',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'workout', 'startedAt', 'completedAt', 'client'],
    group: 'Training log',
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    // V1: share-token read access removed — logs are strictly coach or owner.
    read: adminOrOwnByClient,
    update: adminOrOwnByClient,
    delete: adminOrOwnByClient,
  },
  endpoints: [
    {
      path: '/:id/finish',
      method: 'post',
      handler: finishHandler,
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        if (req.user?.collection === 'clients') {
          data.client = req.user.id

          // A client may only open a session for a workout inside one of
          // their own plans — the chain is resolved server-side.
          if (operation === 'create') {
            if (!data.workout) throw new APIError('Workout is required.', 400)
            const workout = await req.payload.findByID({
              collection: 'workouts',
              id: data.workout,
              depth: 0,
              req,
            })
            const microcycleId =
              typeof workout.microcycle === 'object' ? workout.microcycle?.id : workout.microcycle
            const microcycle = microcycleId
              ? await req.payload.findByID({ collection: 'microcycles', id: microcycleId, depth: 0, req })
              : null
            const planId =
              typeof microcycle?.plan === 'object' ? microcycle.plan?.id : microcycle?.plan
            const plan = planId
              ? await req.payload.findByID({ collection: 'plans', id: planId, depth: 0, req })
              : null
            const ownerId = typeof plan?.client === 'object' ? plan.client?.id : plan?.client
            if (ownerId !== req.user.id) {
              throw new APIError('This workout is not part of your plan.', 403)
            }
          }

          // Completed sessions are history — clients may only touch the note.
          if (operation === 'update' && originalDoc?.completedAt) {
            const ignoredKeys = new Set(['notes', 'client', 'title', 'updatedAt', 'createdAt', 'id'])
            const changedKeys = Object.keys(data).filter(
              (key) => !ignoredKeys.has(key) && data[key] !== originalDoc[key],
            )
            if (changedKeys.length > 0) {
              throw new APIError('This workout is already completed and can no longer be edited.', 400)
            }
          }
        }
        if (operation === 'create' && !data.title && data.workout) {
          try {
            const w = await req.payload.findByID({
              collection: 'workouts',
              id: data.workout,
              depth: 0,
              req,
            })
            data.title = `${w?.title ?? 'Workout'} — ${new Date().toLocaleDateString('en-GB')}`
          } catch {
            /* title will remain empty — we do not block the save */
          }
        }
        if (operation === 'create' && !data.startedAt) {
          data.startedAt = new Date().toISOString()
        }
        return data
      },
    ],
    afterChange: [
      // Keep the coach's client list fresh: track the latest workout date.
      async ({ doc, req }) => {
        const clientId = typeof doc.client === 'object' ? doc.client?.id : doc.client
        if (!clientId) return
        const when = doc.startedAt ?? doc.createdAt
        if (!when) return
        try {
          const client = await req.payload.findByID({
            collection: 'clients',
            id: clientId,
            depth: 0,
            overrideAccess: true,
            req,
          })
          if (!client.lastWorkoutAt || new Date(when) > new Date(client.lastWorkoutAt)) {
            await req.payload.update({
              collection: 'clients',
              id: clientId,
              data: { lastWorkoutAt: when },
              depth: 0,
              overrideAccess: true,
              req,
            })
          }
        } catch {
          /* non-critical denormalization — never block the log write */
        }
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Session description',
      admin: { readOnly: true, description: 'Auto-generated' },
    },
    {
      name: 'workout',
      type: 'relationship',
      relationTo: 'workouts',
      required: true,
      label: 'Workout',
    },
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'clients',
      label: 'Client',
      defaultValue: ({ user }) => (user?.collection === 'clients' ? user.id : undefined),
    },
    {
      name: 'startedAt',
      type: 'date',
      label: 'Started at',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'finishedAt',
      type: 'date',
      label: 'Finished at',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'completedAt',
      type: 'date',
      label: 'Completed at',
      index: true,
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Set once when the client finishes the workout. Empty = session in progress.',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Workout note (client)',
    },
  ],
}
