import { APIError, type CollectionConfig } from 'payload'
import { isAdmin, isAuthenticated } from '../access'

const PROTOCOL_OPTIONS = [
  { label: 'Brak (dziedziczy z grupy)', value: '' },
  { label: 'Standard', value: 'standard' },
  { label: 'EMOM', value: 'emom' },
  { label: 'AMRAP', value: 'amrap' },
  { label: 'For Time', value: 'for_time' },
  { label: 'Tabata', value: 'tabata' },
]

export const WorkoutExerciseRows: CollectionConfig = {
  slug: 'workout-exercise-rows',
  admin: {
    useAsTitle: 'numer',
    defaultColumns: ['numer', 'exercise', 'group', 'reps', 'kg'],
    group: 'Plan treningowy',
  },
  access: {
    create: isAdmin,
    read: isAuthenticated,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeDelete: [
      async ({ id, req }) => {
        const result = await req.payload.count({
          collection: 'set-logs',
          where: { exerciseRow: { equals: id } },
        })
        if (result.totalDocs > 0) {
          throw new APIError(
            'Nie można usunąć ćwiczenia, które ma już zapisane logi. Utwórz nową wersję treningu zamiast modyfikować istniejącą.',
            400,
          )
        }
      },
    ],
  },
  fields: [
    {
      name: 'group',
      type: 'relationship',
      relationTo: 'workout-groups',
      required: true,
      label: 'Grupa',
    },
    {
      name: 'order',
      type: 'number',
      label: 'Kolejność',
      defaultValue: 0,
    },
    {
      name: 'numer',
      type: 'text',
      label: 'Numer',
      admin: { description: 'np. "1a", "2b"' },
    },
    {
      name: 'exercise',
      type: 'relationship',
      relationTo: 'exercises',
      label: 'Ćwiczenie (katalog)',
      admin: { description: 'Powiązanie z katalogiem — do wideo i progresu' },
    },
    {
      name: 'note',
      type: 'text',
      label: 'Uwaga / wariant',
    },
    {
      type: 'row',
      fields: [
        { name: 'rounds', type: 'text', label: 'Serie', admin: { width: '25%', description: 'np. 4, 3-4' } },
        { name: 'reps', type: 'text', label: 'Powtórzenia', admin: { width: '25%' } },
        { name: 'kg', type: 'text', label: 'KG', admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'tut', type: 'text', label: 'TUT', admin: { width: '33%' } },
        { name: 'rir', type: 'text', label: 'RIR', admin: { width: '33%' } },
        { name: 'rest', type: 'text', label: 'Przerwa', admin: { width: '34%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'durationMin',
          type: 'number',
          label: 'Czas — minuty',
          min: 0,
          admin: { width: '50%' },
        },
        {
          name: 'durationSec',
          type: 'number',
          label: 'Czas — sekundy',
          min: 0,
          max: 59,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'setParameters',
      type: 'array',
      label: 'Parametry per seria',
      labels: { singular: 'Seria', plural: 'Serie' },
      admin: {
        description: 'Wypełnij tylko dla drop setów / piramidy. Puste = wszystkie serie identyczne.',
        initCollapsed: true,
      },
      fields: [
        { name: 'setNumber', type: 'number', label: 'Nr serii', required: true },
        { name: 'reps', type: 'text', label: 'Powtórzenia' },
        { name: 'kg', type: 'text', label: 'KG' },
      ],
    },
    {
      name: 'override',
      type: 'group',
      label: 'Override protokołu grupy',
      admin: { description: 'Zostaw puste jeśli ćwiczenie dziedziczy protokół z grupy.' },
      fields: [
        {
          name: 'protocol',
          type: 'select',
          label: 'Protokół',
          options: PROTOCOL_OPTIONS,
        },
        { name: 'rounds', type: 'text', label: 'Serie / rundy' },
        { name: 'durationMinutes', type: 'number', label: 'Czas (minuty)', min: 0 },
        { name: 'intervalSeconds', type: 'number', label: 'Interwał (s)', min: 1 },
        { name: 'workSeconds', type: 'number', label: 'Czas pracy (s)', min: 1 },
        { name: 'restSeconds', type: 'number', label: 'Odpoczynek (s)', min: 0 },
      ],
    },
  ],
}
