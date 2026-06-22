'use client'

import { useTranslations } from 'next-intl'
import { NoteField } from '@/components/workout/note-field'

export function ExerciseNote({
  note,
  readOnly,
  onSave,
}: {
  note: string
  readOnly?: boolean
  onSave?: (note: string) => Promise<void>
}) {
  const t = useTranslations('exercise')

  return (
    <div className="mt-0.5">
      <NoteField
        note={note}
        readOnly={readOnly}
        onSave={onSave}
        labels={{
          label: t('noteLabel'),
          add: t('addNote'),
          edit: t('editNote'),
          placeholder: t('notePlaceholder'),
          save: t('saveNote'),
          cancel: t('cancelNote'),
        }}
      />
    </div>
  )
}
