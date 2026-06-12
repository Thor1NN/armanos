import type { CollectionConfig } from 'payload'
import { isAdmin, isAuthenticated } from '../access'

const PROTOCOL_OPTIONS = [
  { label: 'Standard', value: 'standard' },
  { label: 'EMOM', value: 'emom' },
  { label: 'AMRAP', value: 'amrap' },
  { label: 'For Time', value: 'for_time' },
  { label: 'Tabata', value: 'tabata' },
]

export const WorkoutGroups: CollectionConfig = {
  slug: 'workout-groups',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['workout', 'protocol', 'rounds', 'order'],
    group: 'Plan treningowy',
  },
  access: {
    create: isAdmin,
    read: isAuthenticated,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'workout',
      type: 'relationship',
      relationTo: 'workouts',
      required: true,
      label: 'Trening',
    },
    {
      name: 'sectionRowId',
      type: 'text',
      label: 'ID sekcji',
      admin: { description: 'Row ID sekcji z workout.sections' },
    },
    {
      name: 'label',
      type: 'text',
      label: 'Nazwa grupy',
      admin: { description: 'np. "Superset górny", "Część główna A" (opcjonalne)' },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Kolejność',
      defaultValue: 0,
    },
    {
      name: 'protocol',
      type: 'select',
      label: 'Protokół',
      defaultValue: 'standard',
      options: PROTOCOL_OPTIONS,
    },
    {
      name: 'rounds',
      type: 'text',
      label: 'Serie / rundy',
      admin: { description: 'np. "4", "1-3"' },
    },
    {
      name: 'durationMinutes',
      type: 'number',
      label: 'Czas (minuty)',
      min: 0,
      admin: { description: 'Używane dla AMRAP' },
    },
    {
      name: 'intervalSeconds',
      type: 'number',
      label: 'Interwał (s)',
      min: 1,
      admin: { description: 'Używane dla EMOM — domyślnie 60' },
      defaultValue: 60,
    },
    {
      name: 'workSeconds',
      type: 'number',
      label: 'Czas pracy (s)',
      min: 1,
      admin: { description: 'Używane dla Tabata — domyślnie 20' },
      defaultValue: 20,
    },
    {
      name: 'restSeconds',
      type: 'number',
      label: 'Odpoczynek (s)',
      min: 0,
      admin: { description: 'Używane dla Tabata — domyślnie 10' },
      defaultValue: 10,
    },
    {
      name: 'restBetweenRounds',
      type: 'text',
      label: 'Przerwa między rundami',
      admin: { description: 'Przerwa po ukończeniu pełnej rundy/obwodu' },
    },
  ],
}
