'use client'

import { Button, Form, SelectField, TextField, toast, useDocumentInfo, useFormFields, useFormProcessing } from '@payloadcms/ui'
import type { FormState, SelectFieldClient, TextFieldClient } from 'payload'
import type { Group } from '../types'
import { PROTOCOLS } from '../constants'
import { s } from '../styles'
import type { WorkoutGroup } from '@/payload-types'
import { sdk } from '@/lib/sdk'
import {
  validateDurationMinutes,
  validateIntervalSeconds,
  validateRestSeconds,
  validateRounds,
  validateWorkSeconds,
} from '../utils'

const textField = (name: string, label: string, placeholder?: string): TextFieldClient =>
  ({ name, label, type: 'text', admin: { placeholder } }) as TextFieldClient

const protocolField: SelectFieldClient = {
  name: 'protocol',
  type: 'select',
  label: 'Protokół',
  options: PROTOCOLS,
} as SelectFieldClient

type Props = {
  sectionRowId: string | undefined
  nextOrder: number
  initial?: Group
  onSaved: (group: Group) => void
  onCancel: () => void
}

type AnyFields = Record<string, { value: unknown } | undefined>

function FormFields({ onCancel }: { onCancel: () => void }) {
  const processing = useFormProcessing()
  const protocol = useFormFields(
    ([fields]) => ((fields as unknown as AnyFields)['protocol']?.value as string) ?? 'standard'
  )

  return (
    <>
      <div style={s.formRow}>
        <div style={{ flex: '1 1 200px' }}>
          <TextField path="label" field={textField('label', 'Nazwa grupy (opcjonalna)', 'np. Superset górny, Część A')} />
        </div>
      </div>

      <div style={s.formRow}>
        <div style={{ flex: '1 1 140px' }}>
          <SelectField path="protocol" field={protocolField} />
        </div>

        {protocol !== 'amrap' && protocol !== 'tabata' && (
          <div style={{ flex: '1 1 80px' }}>
            <TextField path="rounds" field={textField('rounds', 'Serie / rundy', 'np. 4, 1-3')} validate={validateRounds} />
          </div>
        )}

        {protocol === 'amrap' && (
          <div style={{ flex: '1 1 80px' }}>
            <TextField path="durationMinutes" field={textField('durationMinutes', 'Czas (min)', '10')} validate={validateDurationMinutes} />
          </div>
        )}

        {protocol === 'emom' && (
          <div style={{ flex: '1 1 80px' }}>
            <TextField path="intervalSeconds" field={textField('intervalSeconds', 'Interwał (s)')} validate={validateIntervalSeconds} />
          </div>
        )}

        {protocol === 'tabata' && (
          <>
            <div style={{ flex: '1 1 70px' }}>
              <TextField path="workSeconds" field={textField('workSeconds', 'Praca (s)')} validate={validateWorkSeconds} />
            </div>
            <div style={{ flex: '1 1 70px' }}>
              <TextField path="restSeconds" field={textField('restSeconds', 'Odpoczynek (s)')} validate={validateRestSeconds} />
            </div>
          </>
        )}
      </div>

      <div style={s.formRow}>
        <div style={{ flex: '1 1 160px' }}>
          <TextField path="restBetweenRounds" field={textField('restBetweenRounds', 'Przerwa między rundami', 'np. 90 sek')} />
        </div>
      </div>

      <div style={s.formActions}>
        <Button buttonStyle="secondary" margin={false} type="button" onClick={onCancel} disabled={processing}>
          Anuluj
        </Button>
        <Button buttonStyle="primary" margin={false} type="submit" disabled={processing}>
          {processing ? 'Zapisuję…' : 'Zapisz grupę'}
        </Button>
      </div>
    </>
  )
}

export function GroupForm({ sectionRowId, nextOrder, initial, onSaved, onCancel }: Props) {
  const { id: docId } = useDocumentInfo()
  const isEdit = !!initial

  const initialState: FormState = {
    label:             { value: initial?.label             ?? '' },
    protocol:          { value: initial?.protocol          ?? 'standard' },
    rounds:            { value: initial?.rounds            ?? '' },
    durationMinutes:   { value: String(initial?.durationMinutes  ?? '') },
    intervalSeconds:   { value: String(initial?.intervalSeconds  ?? '60') },
    workSeconds:       { value: String(initial?.workSeconds      ?? '20') },
    restSeconds:       { value: String(initial?.restSeconds      ?? '10') },
    restBetweenRounds: { value: initial?.restBetweenRounds ?? '' },
  }

  const handleSubmit = async (_: FormState, data: Record<string, unknown>) => {
    const protocol = data.protocol as string
    const body: Record<string, unknown> = {
      label:             (data.label             as string) || null,
      protocol,
      rounds:            (data.rounds            as string) || null,
      durationMinutes:   data.durationMinutes    ? Number(data.durationMinutes)  : null,
      intervalSeconds:   data.intervalSeconds    ? Number(data.intervalSeconds)  : null,
      workSeconds:       data.workSeconds        ? Number(data.workSeconds)      : null,
      restSeconds:       data.restSeconds        ? Number(data.restSeconds)      : null,
      restBetweenRounds: (data.restBetweenRounds as string) || null,
      ...(!isEdit && { workout: docId, sectionRowId: sectionRowId ?? '', order: nextOrder }),
    }

    try {
      const doc = isEdit
        ? await sdk.update({ collection: 'workout-groups', id: initial!.id, data: body as unknown as WorkoutGroup })
        : await sdk.create({ collection: 'workout-groups', data: body as unknown as WorkoutGroup })
      toast.success(isEdit ? 'Grupa zaktualizowana' : 'Grupa dodana')
      onSaved(doc as unknown as Group)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd zapisu')
    }
  }

  return (
    <div style={s.formBox}>
      <div style={{ ...s.label, fontWeight: 700, color: 'var(--theme-text)', marginBottom: 10 }}>
        {isEdit ? 'Edytuj grupę' : 'Nowa grupa'}
      </div>

      <Form initialState={initialState} onSubmit={handleSubmit}>
        <FormFields onCancel={onCancel} />
      </Form>
    </div>
  )
}
