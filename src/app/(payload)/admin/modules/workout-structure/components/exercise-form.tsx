'use client'

import { Button, Form, RelationshipField, TextField, toast, useFormProcessing } from '@payloadcms/ui'
import type { FormState, SingleRelationshipFieldClient, TextFieldClient, ValueWithRelation } from 'payload'
import type { ExerciseRow } from '../types'
import { s } from '../styles'
import { sdk } from '@/lib/sdk'

const textField = (name: string, label: string, placeholder?: string): TextFieldClient =>
  ({ name, label, type: 'text', admin: { placeholder } }) as TextFieldClient

const exerciseRelField: SingleRelationshipFieldClient = {
  name: 'exercise',
  type: 'relationship',
  relationTo: 'exercises',
  hasMany: false,
  label: 'Ćwiczenie (katalog)',
} as SingleRelationshipFieldClient

import { validateKgOrReps, validateRepsOrKg, validateRounds } from '../utils'

type Props = {
  groupId: number
  nextOrder: number
  initial?: ExerciseRow
  onSaved: (row: ExerciseRow) => void
  onCancel: () => void
}

function FormFields({ isEdit, onCancel }: { isEdit: boolean; onCancel: () => void }) {
  const processing = useFormProcessing()

  return (
    <>
      <div style={s.formRow}>
        <div style={{ flex: '0 0 64px' }}>
          <TextField path="numer" field={textField('numer', 'Numer', '1a')} />
        </div>
        <div style={{ flex: '0 0 80px' }}>
          <TextField path="rounds" field={textField('rounds', 'Serie', '4')} validate={validateRounds} />
        </div>
        <div style={{ flex: 1 }}>
          <RelationshipField path="exercise" field={exerciseRelField} />
        </div>
      </div>

      <div style={s.formRow}>
        <div style={{ flex: 1 }}>
          <TextField path="note" field={textField('note', 'Uwaga / wariant', 'opcjonalnie')} />
        </div>
      </div>

      <div style={s.formRow}>
        <div style={{ flex: '1 1 70px' }}>
          <TextField path="reps" field={textField('reps', 'Powt.', '8')} validate={validateRepsOrKg} />
        </div>
        <div style={{ flex: '1 1 70px' }}>
          <TextField path="kg" field={textField('kg', 'KG', '60')} validate={validateKgOrReps} />
        </div>
        <div style={{ flex: '1 1 70px' }}>
          <TextField path="rir" field={textField('rir', 'RIR', '2')} />
        </div>
        <div style={{ flex: '1 1 70px' }}>
          <TextField path="tut" field={textField('tut', 'TUT', '3-0-1')} />
        </div>
        <div style={{ flex: '1 1 90px' }}>
          <TextField path="rest" field={textField('rest', 'Przerwa', '90 sek')} />
        </div>
      </div>

      <div style={s.formActions}>
        <Button buttonStyle="secondary" margin={false} type="button" onClick={onCancel}>
          Anuluj
        </Button>
        <Button buttonStyle="primary" margin={false} type="submit" disabled={processing}>
          {processing ? 'Zapisuję…' : isEdit ? 'Zapisz ćwiczenie' : 'Dodaj ćwiczenie'}
        </Button>
      </div>
    </>
  )
}

export function ExerciseForm({ groupId, nextOrder, initial, onSaved, onCancel }: Props) {
  const isEdit = !!initial

  const initialState: FormState = {
    numer:    { value: initial?.numer    ?? '' },
    rounds:   { value: initial?.rounds   ?? '' },
    exercise: { value: initial?.exercise ? { value: initial.exercise.id, relationTo: 'exercises' } : null },
    note:     { value: initial?.note     ?? '' },
    reps:     { value: initial?.reps     ?? '' },
    kg:       { value: initial?.kg       ?? '' },
    rir:      { value: initial?.rir      ?? '' },
    tut:      { value: initial?.tut      ?? '' },
    rest:     { value: initial?.rest     ?? '' },
  }

  const handleSubmit = async (_: FormState, data: Record<string, unknown>) => {
    const exerciseRaw = data.exercise as ValueWithRelation | null
    const body = {
      numer:    (data.numer   as string) || null,
      rounds:   (data.rounds  as string) || null,
      exercise: exerciseRaw ? Number(exerciseRaw.value) : null,
      note:     (data.note    as string) || null,
      reps:     (data.reps    as string) || null,
      kg:       (data.kg      as string) || null,
      rir:      (data.rir     as string) || null,
      tut:      (data.tut     as string) || null,
      rest:     (data.rest    as string) || null,
      ...(!isEdit && { group: groupId, order: nextOrder }),
    }

    try {
      const doc = isEdit
        ? await sdk.update({ collection: 'workout-exercise-rows', id: initial!.id, data: body as never, depth: 1 })
        : await sdk.create({ collection: 'workout-exercise-rows', data: body as never, depth: 1 })

      const exerciseDoc = doc.exercise
      const exerciseObj = exerciseDoc && typeof exerciseDoc === 'object'
        ? { id: (exerciseDoc as { id: number }).id, name: (exerciseDoc as { name?: string | null }).name ?? null }
        : null
      const normalizedGroup =
        typeof doc.group === 'object' && doc.group !== null ? (doc.group as { id: number }).id : doc.group

      toast.success(isEdit ? 'Ćwiczenie zaktualizowane' : 'Ćwiczenie dodane')
      onSaved({ ...doc, group: normalizedGroup, exercise: exerciseObj } as ExerciseRow)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd zapisu')
    }
  }

  return (
    <div style={s.formBox}>
      <div style={{ ...s.label, fontWeight: 700, color: 'var(--theme-text)', marginBottom: 10 }}>
        {isEdit ? 'Edytuj ćwiczenie' : 'Nowe ćwiczenie'}
      </div>

      <Form initialState={initialState} onSubmit={handleSubmit}>
        <FormFields isEdit={isEdit} onCancel={onCancel} />
      </Form>
    </div>
  )
}
