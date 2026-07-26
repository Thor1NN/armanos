'use client'

import { Button, Form, RelationshipField, SelectField, TextField, toast, useFormFields, useFormProcessing } from '@payloadcms/ui'
import type { FormState, SelectFieldClient, SingleRelationshipFieldClient } from 'payload'
import type { ExerciseRow } from '../../types'
import { s } from '../../styles'
import { sdk } from '@/lib/sdk'
import {
  EXERCISE_TARGET_TYPE_OPTIONS,
  type ExerciseTargetType,
} from '@/modules/training/exercises'
import { textField } from '../../utils/fields'
import { validateDuration, validateKgOrRepsSides, validateRepsSidesOrKg, validateRounds } from '../../utils'

type ExerciseFormProps = {
  groupId: number
  nextOrder: number
  initial?: ExerciseRow
  onSaved: (row: ExerciseRow) => void
  onCancel: () => void
}

const exerciseRelField: SingleRelationshipFieldClient = {
  name: 'exercise',
  type: 'relationship',
  relationTo: 'exercises',
  hasMany: false,
  label: 'Exercise (catalog)',
} as SingleRelationshipFieldClient

const targetTypeField: SelectFieldClient = {
  name: 'targetType',
  type: 'select',
  label: 'Target type',
  options: EXERCISE_TARGET_TYPE_OPTIONS,
} as SelectFieldClient

type FieldStateMap = Record<string, { value: unknown } | undefined>

function FormFields({ isEdit, onCancel }: { isEdit: boolean; onCancel: () => void }) {
  const processing = useFormProcessing()
  const targetType = useFormFields(
    ([fields]) => ((fields as unknown as FieldStateMap).targetType?.value as string) ?? 'repetitions',
  )

  return (
    <>
      <div style={s.formRow}>
        <div style={{ flex: '0 0 64px' }}>
          <TextField path="numer" field={textField('numer', 'No.', '1a')} />
        </div>
        <div style={{ flex: '0 0 80px' }}>
          <TextField path="rounds" field={textField('rounds', 'Sets', '4')} validate={validateRounds} />
        </div>
        <div style={{ flex: 1 }}>
          <RelationshipField path="exercise" field={exerciseRelField} />
        </div>
      </div>

      <div style={s.formRow}>
        <div style={{ flex: 1 }}>
          <TextField path="note" field={textField('note', 'Note / variant', 'optional')} />
        </div>
      </div>

      <div style={s.formRow}>
        <div style={{ flex: '1 1 160px' }}>
          <SelectField path="targetType" field={targetTypeField} />
        </div>
      </div>

      {targetType === 'duration' ? (
        <div style={s.formRow}>
          <div style={{ flex: '1 1 70px' }}>
            <TextField path="durationMin" field={textField('durationMin', 'Duration (min)', '1')} validate={validateDuration} />
          </div>
          <div style={{ flex: '1 1 70px' }}>
            <TextField path="durationSec" field={textField('durationSec', 'Duration (s)', '30')} validate={validateDuration} />
          </div>
          <ExerciseDetailsFields targetType={targetType} />
        </div>
      ) : (
        <div style={s.formRow}>
          <div style={{ flex: '1 1 70px' }}>
            <TextField path="repsLeft" field={textField('repsLeft', 'Reps left', '8')} validate={validateRepsSidesOrKg} />
          </div>
          <div style={{ flex: '1 1 70px' }}>
            <TextField path="repsRight" field={textField('repsRight', 'Reps right', '8')} validate={validateRepsSidesOrKg} />
          </div>
          <ExerciseDetailsFields targetType={targetType} />
        </div>
      )}

      <div style={s.formActions}>
        <Button buttonStyle="secondary" margin={false} type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button buttonStyle="primary" margin={false} type="submit" disabled={processing}>
          {processing ? 'Saving…' : isEdit ? 'Save exercise' : 'Add exercise'}
        </Button>
      </div>
    </>
  )
}

function ExerciseDetailsFields({ targetType }: { targetType: string }) {
  return (
    <>
      <div style={{ flex: '1 1 70px' }}>
        <TextField
          path="kg"
          field={textField('kg', 'KG', '60')}
          validate={targetType === 'repetitions' ? validateKgOrRepsSides : undefined}
        />
      </div>
      <div style={{ flex: '1 1 70px' }}>
        <TextField path="rir" field={textField('rir', 'RIR', '2')} />
      </div>
      <div style={{ flex: '1 1 70px' }}>
        <TextField path="tut" field={textField('tut', 'TUT', '3-0-1')} />
      </div>
      <div style={{ flex: '1 1 90px' }}>
        <TextField path="rest" field={textField('rest', 'Rest(s)', '90')} />
      </div>
    </>
  )
}

export function ExerciseForm({
  groupId,
  nextOrder,
  initial,
  onSaved,
  onCancel,
}: ExerciseFormProps) {
  const isEdit = !!initial

  const initialState: FormState = {
    numer:    { value: initial?.numer    ?? '' },
    rounds:   { value: initial?.rounds   ?? '' },
    exercise: { value: initial?.exercise?.id ?? null },
    note:     { value: initial?.note     ?? '' },
    targetType: { value: initial?.targetType ?? 'repetitions' },
    repsLeft: { value: initial?.repsLeft ?? '' },
    repsRight: { value: initial?.repsRight ?? '' },
    kg:       { value: initial?.kg       ?? '' },
    rir:      { value: initial?.rir      ?? '' },
    tut:      { value: initial?.tut      ?? '' },
    rest:     { value: initial?.rest     ?? '' },
    durationMin: { value: initial?.durationMin ?? '' },
    durationSec: { value: initial?.durationSec ?? '' },
  }

  const handleSubmit = async (_: FormState, data: Record<string, unknown>) => {
    const exerciseId = data.exercise as number | string | null
    const targetType = (data.targetType as ExerciseTargetType) ?? 'repetitions'
    const body = {
      numer:    (data.numer   as string) || null,
      rounds:   (data.rounds  as string) || null,
      exercise: exerciseId ? Number(exerciseId) : null,
      note:     (data.note    as string) || null,
      targetType,
      repsLeft: targetType === 'repetitions' ? (data.repsLeft as string) || null : null,
      repsRight: targetType === 'repetitions' ? (data.repsRight as string) || null : null,
      kg:       (data.kg      as string) || null,
      rir:      (data.rir     as string) || null,
      tut:      (data.tut     as string) || null,
      rest:     (data.rest    as string) || null,
      durationMin: targetType === 'duration' && String(data.durationMin ?? '').trim() !== '' ? Number(data.durationMin) : null,
      durationSec: targetType === 'duration' && String(data.durationSec ?? '').trim() !== '' ? Number(data.durationSec) : null,
    }

    try {
      const doc = isEdit
        ? await sdk.update({
            collection: 'workout-exercise-rows',
            id: initial!.id,
            data: body,
            depth: 1,
          })
        : await sdk.create({
            collection: 'workout-exercise-rows',
            data: { ...body, group: groupId, order: nextOrder },
            depth: 1,
          })

      const exerciseDoc = doc.exercise
      const exerciseObj = exerciseDoc && typeof exerciseDoc === 'object'
        ? { id: exerciseDoc.id, name: exerciseDoc.name }
        : null
      const normalizedGroup =
        typeof doc.group === 'object' ? doc.group.id : doc.group

      toast.success(isEdit ? 'Exercise updated' : 'Exercise added')
      onSaved({ ...doc, group: normalizedGroup, exercise: exerciseObj })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    }
  }

  return (
    <div style={s.formBox}>
      <div style={{ ...s.label, fontWeight: 700, color: 'var(--theme-text)', marginBottom: 10 }}>
        {isEdit ? 'Edit exercise' : 'New exercise'}
      </div>

      <Form initialState={initialState} onSubmit={handleSubmit}>
        <FormFields isEdit={isEdit} onCancel={onCancel} />
      </Form>
    </div>
  )
}
