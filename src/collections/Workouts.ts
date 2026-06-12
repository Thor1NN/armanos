import type { CollectionConfig } from 'payload'

export const Workouts: CollectionConfig = {
  slug: 'workouts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'rpe', 'order', 'microcycle'],
    group: 'Plan treningowy',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Nazwa treningu',
    },
    {
      name: 'microcycle',
      type: 'relationship',
      relationTo: 'microcycles',
      required: true,
      label: 'Mikrocykl',
    },
    {
      name: 'rpe',
      type: 'number',
      label: 'RPE',
    },
    {
      name: 'order',
      type: 'number',
      label: 'Kolejność',
      defaultValue: 0,
    },
    {
      name: 'sections',
      type: 'array',
      label: 'Sekcje',
      labels: { singular: 'Sekcja', plural: 'Sekcje' },
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Tytuł sekcji',
          admin: { description: 'np. Rozgrzewka, Część główna' },
        },
        {
          name: 'subtitle',
          type: 'text',
          label: 'Podtytuł',
          admin: { description: 'np. Upper Body, EMOM' },
        },
        {
          name: 'groups',
          type: 'array',
          label: 'Grupy serii',
          labels: { singular: 'Grupa', plural: 'Grupy' },
          fields: [
            {
              name: 'setType',
              type: 'text',
              label: 'Typ serii',
              admin: { description: 'np. Serie wstępne / Serie główne' },
            },
            {
              name: 'exercises',
              type: 'array',
              label: 'Ćwiczenia',
              labels: { singular: 'Ćwiczenie', plural: 'Ćwiczenia' },
              fields: [
                { name: 'numer', type: 'text', label: 'Numer' },
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
                  admin: {
                    description: 'Opcjonalnie — gdy nazwa z katalogu nie wystarcza (wskazówka, wariant, instrukcja)',
                  },
                },
                { name: 'series', type: 'text', label: 'Serie' },
                { name: 'reps', type: 'text', label: 'Powtórzenia' },
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
                { name: 'rest', type: 'text', label: 'Przerwa' },
                { name: 'tut', type: 'text', label: 'TUT' },
                { name: 'rir', type: 'text', label: 'RIR' },
                { name: 'kg', type: 'text', label: 'KG' },
                {
                  name: 'extra',
                  type: 'text',
                  label: 'Dodatkowe',
                  admin: { description: 'Nietypowe kolumny (EMOM itd.)' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
