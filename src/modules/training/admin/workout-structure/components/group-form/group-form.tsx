'use client'

import { Button, CheckboxField, Form, SelectField, TextField, toast, useDocumentInfo, useFormFields, useFormProcessing } from '@payloadcms/ui'
import type { CheckboxFieldClient, FormState, SelectFieldClient } from 'payload'
import { s } from '../../styles'
import type { WorkoutGroup } from '@/payload-types'
import { sdk } from '@/lib/sdk'
import { PROTOCOL_OPTIONS, type WorkoutProtocol } from '@/modules/training/plans'

import { textField } from '../../utils/fields'
import {
  validateDurationMinutes,
  validateIntervalSeconds,
  validateRestSeconds,
  validateRounds,
  validateWorkSeconds,
} from '../../utils'

const protocolField: SelectFieldClient = {
  name: 'protocol',
  type: 'select',
  label: 'Protocol',
  options: PROTOCOL_OPTIONS,
} as SelectFieldClient

const bundleField: CheckboxFieldClient = {
  name: 'bundleWithPrevious',
  type: 'checkbox',
  label: 'Merge into the previous block',
} as CheckboxFieldClient

type GroupFormProps = {
  sectionRowId: string | null | undefined
  nextOrder: number
  initial?: WorkoutGroup
  onSaved: (group: WorkoutGroup) => void
  onCancel: () => void
}

type FieldStateMap = Record<string, { value: unknown } | undefined>

function FormFields({ onCancel }: { onCancel: () => void }) {
  const processing = useFormProcessing()
  const protocol = useFormFields(
    ([fields]) => ((fields as unknown as FieldStateMap)['protocol']?.value as string) ?? 'standard'
  )

  return (
    <>
      <div style={s.formRow}>
        <div style={{ flex: '1 1 200px' }}>
          <TextField path="label" field={textField('label', 'Group name (optional)', 'e.g. Upper superset, Part A')} />
        </div>
      </div>

      <div style={s.formRow}>
        <div style={{ flex: '1 1 200px' }}>
          <CheckboxField path="bundleWithPrevious" field={bundleField} />
        </div>
      </div>

      <div style={s.formRow}>
        <div style={{ flex: '1 1 140px' }}>
          <SelectField path="protocol" field={protocolField} />
        </div>

        {protocol !== 'amrap' && protocol !== 'tabata' && (
          <div style={{ flex: '1 1 80px' }}>
            <TextField path="rounds" field={textField('rounds', 'Sets / rounds', 'e.g. 4, 1-3')} validate={validateRounds} />
          </div>
        )}

        {protocol === 'amrap' && (
          <div style={{ flex: '1 1 80px' }}>
            <TextField path="durationMinutes" field={textField('durationMinutes', 'Duration (min)', '10')} validate={validateDurationMinutes} />
          </div>
        )}

        {protocol === 'emom' && (
          <div style={{ flex: '1 1 80px' }}>
            <TextField path="intervalSeconds" field={textField('intervalSeconds', 'Interval (s)')} validate={validateIntervalSeconds} />
          </div>
        )}

        {protocol === 'tabata' && (
          <>
            <div style={{ flex: '1 1 70px' }}>
              <TextField path="workSeconds" field={textField('workSeconds', 'Work (s)')} validate={validateWorkSeconds} />
            </div>
            <div style={{ flex: '1 1 70px' }}>
              <TextField path="restSeconds" field={textField('restSeconds', 'Rest(s)')} validate={validateRestSeconds} />
            </div>
          </>
        )}
      </div>

      <div style={s.formRow}>
        <div style={{ flex: '1 1 160px' }}>
          <TextField path="restBetweenRounds" field={textField('restBetweenRounds', 'Rest between rounds', 'e.g. 90 sec')} />
        </div>
      </div>

      <div style={s.formActions}>
        <Button buttonStyle="secondary" margin={false} type="button" onClick={onCancel} disabled={processing}>
          Cancel
        </Button>
        <Button buttonStyle="primary" margin={false} type="submit" disabled={processing}>
          {processing ? 'Saving…' : 'Save group'}
        </Button>
      </div>
    </>
  )
}

export function GroupForm({
  sectionRowId,
  nextOrder,
  initial,
  onSaved,
  onCancel,
}: GroupFormProps) {
  const { id: docId } = useDocumentInfo()
  const isEdit = !!initial

  const initialState: FormState = {
    label:             { value: initial?.label             ?? '' },
    bundleWithPrevious:{ value: initial?.bundleWithPrevious ?? false },
    protocol:          { value: initial?.protocol          ?? 'standard' },
    rounds:            { value: initial?.rounds            ?? '' },
    durationMinutes:   { value: String(initial?.durationMinutes  ?? '') },
    intervalSeconds:   { value: String(initial?.intervalSeconds  ?? '60') },
    workSeconds:       { value: String(initial?.workSeconds      ?? '20') },
    restSeconds:       { value: String(initial?.restSeconds      ?? '10') },
    restBetweenRounds: { value: initial?.restBetweenRounds ?? '' },
  }

  const handleSubmit = async (_: FormState, data: Record<string, unknown>) => {
    const body = {
      label:             (data.label             as string) || null,
      bundleWithPrevious: Boolean(data.bundleWithPrevious),
      protocol:           data.protocol as WorkoutProtocol,
      rounds:            (data.rounds            as string) || null,
      durationMinutes:   data.durationMinutes    ? Number(data.durationMinutes)  : null,
      intervalSeconds:   data.intervalSeconds    ? Number(data.intervalSeconds)  : null,
      workSeconds:       data.workSeconds        ? Number(data.workSeconds)      : null,
      restSeconds:       data.restSeconds        ? Number(data.restSeconds)      : null,
      restBetweenRounds: (data.restBetweenRounds as string) || null,
    }

    try {
      let doc: WorkoutGroup

      if (isEdit) {
        doc = await sdk.update({ collection: 'workout-groups', id: initial!.id, data: body })
      } else {
        if (docId == null) return
        doc = await sdk.create({
          collection: 'workout-groups',
          data: {
            ...body,
            workout: Number(docId),
            sectionRowId: sectionRowId ?? '',
            order: nextOrder,
          },
        })
      }

      toast.success(isEdit ? 'Group updated' : 'Group added')
      onSaved(doc)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    }
  }

  return (
    <div style={s.formBox}>
      <div style={{ ...s.label, fontWeight: 700, color: 'var(--theme-text)', marginBottom: 10 }}>
        {isEdit ? 'Edit group' : 'New group'}
      </div>

      <Form initialState={initialState} onSubmit={handleSubmit}>
        <FormFields onCancel={onCancel} />
      </Form>
    </div>
  )
}
