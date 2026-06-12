import type { CollectionConfig } from 'payload'
import { adminOrOwnByClient } from '../access'
import { trackingFields, ALL_METRIC_FIELDS } from '../trackingTypes'

export const SetLogs: CollectionConfig = {
  slug: 'set-logs',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['exerciseName', 'setNumber', 'weight', 'reps', 'client'],
    group: 'Dziennik treningów',
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: adminOrOwnByClient,
    update: adminOrOwnByClient,
    delete: adminOrOwnByClient,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        if (!data) return data
        // Klient nie może logować do cudzej sesji
        if (req.user?.collection === 'clients' && data.session) {
          const session = await req.payload.findByID({
            collection: 'workout-logs',
            id: data.session,
            depth: 0,
          })
          const owner = typeof session.client === 'object' ? session.client?.id : session.client
          if (owner !== req.user.id) {
            throw new Error('Nie możesz logować serii do cudzej sesji.')
          }
        }
        // Wyzeruj metryki spoza typu pomiaru ćwiczenia (czyste dane pod wykresy)
        if (data.exercise) {
          const ex = await req.payload.findByID({
            collection: 'exercises',
            id: data.exercise,
            depth: 0,
          })
          const allowed = trackingFields(ex?.trackingType)
          for (const f of ALL_METRIC_FIELDS) {
            if (!allowed.includes(f) && data[f] != null) data[f] = null
          }
        }
        return data
      },
    ],
    beforeChange: [
      ({ data, req }) => {
        // Klient zawsze loguje na siebie (ignoruj client z frontu)
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
      label: 'Sesja',
    },
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'clients',
      label: 'Klient',
      defaultValue: ({ user }) => (user?.collection === 'clients' ? user.id : undefined),
    },
    {
      // Snapshot — relacja do katalogu (progres między treningami)
      name: 'exercise',
      type: 'relationship',
      relationTo: 'exercises',
      label: 'Ćwiczenie (katalog)',
    },
    {
      // Snapshot tekstowy — trwałość historii nawet po usunięciu z katalogu
      name: 'exerciseName',
      type: 'text',
      label: 'Ćwiczenie (nazwa, migawka)',
    },
    {
      // Które zlecenie w treningu (id wiersza tablicy) — grupowanie w UI sesji
      name: 'workoutExerciseRowId',
      type: 'text',
      label: 'ID zlecenia w treningu',
      admin: { readOnly: true },
    },
    {
      name: 'setNumber',
      type: 'number',
      label: 'Nr serii',
    },
    {
      name: 'weight',
      type: 'number',
      label: 'Ciężar (kg)',
    },
    {
      name: 'distanceM',
      type: 'number',
      label: 'Dystans (m)',
    },
    {
      name: 'durationSec',
      type: 'number',
      label: 'Czas (s)',
    },
    {
      name: 'reps',
      type: 'text',
      label: 'Powtórzenia',
    },
    {
      name: 'rir',
      type: 'text',
      label: 'RIR',
    },
    {
      name: 'note',
      type: 'text',
      label: 'Notatka',
    },
    {
      name: 'completedAt',
      type: 'date',
      label: 'Wykonano',
      defaultValue: () => new Date().toISOString(),
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
}
