import { APIError, type CollectionConfig, type PayloadRequest } from 'payload'
import { adminOrOwnByClient } from '../../access'
import { ALL_METRIC_FIELDS, getTrackingFields } from '@/modules/training/exercises'
import { LEGACY_SET_LOG_FIELDS } from '@/modules/training/logs'
import {
  assertWritableOwnSession,
  validateNonNegative,
  validateNonNegativeInt,
  validateRir,
  validateSetNumber,
  validateWeight,
} from '../shared/log-integrity'

const validateRepsText = (value: string | null | undefined): true | string => {
  if (value === null || value === undefined || value === '') return true
  if (!/^\d+$/.test(value.trim())) return 'Reps must be a non-negative whole number.'
  return true
}

/**
 * Idempotent write path for the tracker's autosave. A set is identified by
 * (session, exerciseRow, setNumber): if a row already exists it is updated,
 * otherwise it is created. The unique DB index on the same key backstops
 * concurrent retries — on a conflict the create is retried as an update.
 */
const upsertHandler = async (req: PayloadRequest) => {
  if (!req.user) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const body = (typeof req.json === 'function' ? await req.json() : null) as Record<
    string,
    unknown
  > | null
  if (!body || !body.session || !body.exerciseRow || !body.setNumber) {
    return Response.json(
      { message: 'session, exerciseRow and setNumber are required.' },
      { status: 400 },
    )
  }

  const key = {
    session: { equals: body.session },
    exerciseRow: { equals: body.exerciseRow },
    setNumber: { equals: body.setNumber },
  }

  const findExisting = async () => {
    const found = await req.payload.find({
      collection: 'set-logs',
      where: { and: [key] },
      limit: 1,
      depth: 0,
      req,
      overrideAccess: false,
      user: req.user,
    })
    return found.docs[0] ?? null
  }

  const updateExisting = async (id: number) =>
    req.payload.update({
      collection: 'set-logs',
      id,
      data: body,
      depth: 0,
      req,
      overrideAccess: false,
      user: req.user,
    })

  try {
    const existing = await findExisting()
    if (existing) {
      const doc = await updateExisting(existing.id)
      return Response.json({ doc, created: false }, { status: 200 })
    }
    try {
      const doc = await req.payload.create({
        collection: 'set-logs',
        data: body as never,
        depth: 0,
        req,
        overrideAccess: false,
        user: req.user,
      })
      return Response.json({ doc, created: true }, { status: 201 })
    } catch (createError) {
      // Unique-index violation → a concurrent request created the row first.
      const message = createError instanceof Error ? createError.message : ''
      if (/unique|duplicate/i.test(message)) {
        const raced = await findExisting()
        if (raced) {
          const doc = await updateExisting(raced.id)
          return Response.json({ doc, created: false }, { status: 200 })
        }
      }
      throw createError
    }
  } catch (error) {
    if (error instanceof APIError) {
      return Response.json({ message: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Upsert failed'
    return Response.json({ message }, { status: 400 })
  }
}

export const SetLogs: CollectionConfig = {
  slug: 'set-logs',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['exerciseName', 'setNumber', 'weightLeft', 'weightRight', 'repsLeft', 'repsRight', 'rir', 'client'],
    group: 'Training log',
  },
  // One row per set: prevents duplicate sets from retries or double-taps.
  indexes: [
    {
      fields: ['session', 'exerciseRow', 'setNumber'],
      unique: true,
    },
  ],
  access: {
    create: ({ req: { user } }) => Boolean(user),
    // V1: share-token read access removed — logs are strictly coach or owner.
    read: adminOrOwnByClient,
    update: adminOrOwnByClient,
    delete: adminOrOwnByClient,
  },
  endpoints: [
    {
      path: '/upsert',
      method: 'post',
      handler: upsertHandler,
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, originalDoc, req }) => {
        if (!data) return data
        await assertWritableOwnSession(req, data.session ?? originalDoc?.session)
        const exerciseRowId = data.exerciseRow ?? originalDoc?.exerciseRow
        const exerciseRow = exerciseRowId
          ? await req.payload.findByID({
              collection: 'workout-exercise-rows',
              id: exerciseRowId,
              depth: 0,
              req,
            })
          : null

        if (exerciseRow?.targetType === 'duration') {
          const allowedFields = new Set<string>(['weightLeft', 'weightRight', 'durationSec', ...LEGACY_SET_LOG_FIELDS])
          for (const field of [...ALL_METRIC_FIELDS, ...LEGACY_SET_LOG_FIELDS]) {
            if (!allowedFields.has(field)) data[field] = null
          }
        } else if (data.exercise) {
          const ex = await req.payload.findByID({
            collection: 'exercises',
            id: data.exercise,
            depth: 0,
            req,
          })
          const allowed = getTrackingFields(ex?.trackingType)
          const allowedFields = new Set<string>([...allowed, ...LEGACY_SET_LOG_FIELDS])
          for (const field of [...ALL_METRIC_FIELDS, ...LEGACY_SET_LOG_FIELDS]) {
            if (!allowedFields.has(field)) data[field] = null
          }
        }
        return data
      },
    ],
    beforeChange: [
      ({ data, req }) => {
        if (req.user?.collection === 'clients') {
          data.client = req.user.id
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'session',
      type: 'relationship',
      relationTo: 'workout-logs',
      required: true,
      label: 'Session',
    },
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'clients',
      label: 'Client',
      defaultValue: ({ user }) => (user?.collection === 'clients' ? user.id : undefined),
    },
    {
      name: 'exercise',
      type: 'relationship',
      relationTo: 'exercises',
      label: 'Exercise (catalog)',
    },
    {
      name: 'exerciseName',
      type: 'text',
      label: 'Exercise (name, snapshot)',
    },
    {
      name: 'exerciseRow',
      type: 'relationship',
      relationTo: 'workout-exercise-rows',
      label: 'Exercise row in workout',
      admin: { readOnly: true },
    },
    {
      name: 'roundLog',
      type: 'relationship',
      relationTo: 'round-logs',
      label: 'Round',
      admin: { readOnly: true },
    },
    {
      name: 'setNumber',
      type: 'number',
      label: 'Set number',
      validate: validateSetNumber,
    },
    {
      name: 'setType',
      type: 'select',
      label: 'Set type',
      defaultValue: 'normal',
      options: [
        { label: 'Normal', value: 'normal' },
        { label: 'Warm-up', value: 'warmup' },
        { label: 'Drop set', value: 'drop' },
        { label: 'Failure', value: 'failure' },
      ],
    },
    {
      name: 'weight',
      type: 'number',
      label: 'Weight (kg)',
      validate: validateWeight,
      admin: { hidden: true },
    },
    {
      name: 'weightLeft',
      type: 'number',
      label: 'Weight left (kg)',
      validate: validateWeight,
    },
    {
      name: 'weightRight',
      type: 'number',
      label: 'Weight right (kg)',
      validate: validateWeight,
    },
    {
      name: 'isBodyweight',
      type: 'checkbox',
      label: 'Bodyweight',
      defaultValue: false,
    },
    {
      name: 'distanceM',
      type: 'number',
      label: 'Distance (m)',
      validate: validateNonNegative,
    },
    {
      name: 'durationSec',
      type: 'number',
      label: 'Duration (s)',
      validate: validateNonNegativeInt,
    },
    {
      name: 'reps',
      type: 'text',
      label: 'Reps',
      validate: validateRepsText,
      admin: { hidden: true },
    },
    {
      name: 'repsLeft',
      type: 'text',
      label: 'Reps left',
      validate: validateRepsText,
    },
    {
      name: 'repsRight',
      type: 'text',
      label: 'Reps right',
      validate: validateRepsText,
    },
    {
      name: 'rir',
      type: 'text',
      label: 'RIR',
      validate: validateRir,
    },
    {
      name: 'note',
      type: 'text',
      label: 'Note',
    },
    {
      name: 'completedAt',
      type: 'date',
      label: 'Completed',
      defaultValue: () => new Date().toISOString(),
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
}
