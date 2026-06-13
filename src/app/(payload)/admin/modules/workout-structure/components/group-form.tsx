'use client'

import React, { useState } from 'react'
import { Button, FieldError, FieldLabel, SelectInput, TextInput, toast, useDocumentInfo } from '@payloadcms/ui'
import type { OptionObject } from 'payload'
import type { Group } from '../types'
import { PROTOCOLS } from '../constants'
import { s } from '../styles'
import type { WorkoutGroup } from '@/payload-types'
import { sdk } from '@/lib/sdk'

type Errors = Partial<Record<string, string>>

function validate(fields: {
  protocol: string
  durationMinutes: string
  intervalSeconds: string
  workSeconds: string
  restSeconds: string
}): Errors {
  const errors: Errors = {}
  if (fields.protocol === 'amrap' && (!fields.durationMinutes || isNaN(Number(fields.durationMinutes)))) {
    errors.durationMinutes = 'Podaj czas (minuty)'
  }
  if (fields.protocol === 'emom' && (!fields.intervalSeconds || isNaN(Number(fields.intervalSeconds)))) {
    errors.intervalSeconds = 'Podaj interwał (sekundy)'
  }
  if (fields.protocol === 'tabata') {
    if (!fields.workSeconds || isNaN(Number(fields.workSeconds))) errors.workSeconds = 'Podaj czas pracy'
    if (!fields.restSeconds || isNaN(Number(fields.restSeconds))) errors.restSeconds = 'Podaj czas odpoczynku'
  }
  return errors
}

type FieldProps = {
  path: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string
}

function Field({ path, label, value, onChange, placeholder, error }: FieldProps) {
  return (
    <TextInput
      path={path}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      Label={<FieldLabel label={label} htmlFor={path} required={false} />}
      Error={<FieldError message={error} showError={!!error} />}
      showError={!!error}
      placeholder={placeholder}
    />
  )
}

type SelectFieldProps = {
  path: string
  label: string
  value: string
  onChange: (v: string) => void
  options: OptionObject[]
  error?: string
}

function SelectField({ path, label, value, onChange, options, error }: SelectFieldProps) {
  return (
    <SelectInput
      name={path}
      path={path}
      Label={<FieldLabel label={label} htmlFor={path} required={false} />}
      Error={<FieldError message={error} showError={!!error} />}
      showError={!!error}
      options={options}
      value={value}
      onChange={(opt) => {
        if (opt && !Array.isArray(opt)) onChange((opt as OptionObject).value)
      }}
    />
  )
}

type Props = {
  sectionRowId: string | undefined
  nextOrder: number
  initial?: Group
  onSaved: (group: Group) => void
  onCancel: () => void
}

export function GroupForm({ sectionRowId, nextOrder, initial, onSaved, onCancel }: Props) {
  const { id: docId } = useDocumentInfo()
  const isEdit = !!initial

  const [label, setLabel] = useState(initial?.label ?? '')
  const [protocol, setProtocol] = useState(initial?.protocol ?? 'standard')
  const [rounds, setRounds] = useState(initial?.rounds ?? '')
  const [durationMinutes, setDurationMinutes] = useState(String(initial?.durationMinutes ?? ''))
  const [intervalSeconds, setIntervalSeconds] = useState(String(initial?.intervalSeconds ?? '60'))
  const [workSeconds, setWorkSeconds] = useState(String(initial?.workSeconds ?? '20'))
  const [restSeconds, setRestSeconds] = useState(String(initial?.restSeconds ?? '10'))
  const [restBetweenRounds, setRestBetweenRounds] = useState(initial?.restBetweenRounds ?? '')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  const clearError = (key: string) =>
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next })

  const handleSave = async () => {
    const validationErrors = validate({ protocol, durationMinutes, intervalSeconds, workSeconds, restSeconds })
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        label: label || null,
        protocol,
        rounds: rounds || null,
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        intervalSeconds: intervalSeconds ? Number(intervalSeconds) : null,
        workSeconds: workSeconds ? Number(workSeconds) : null,
        restSeconds: restSeconds ? Number(restSeconds) : null,
        restBetweenRounds: restBetweenRounds || null,
        ...(!isEdit && { workout: docId, sectionRowId: sectionRowId ?? '', order: nextOrder }),
      }

      const doc = isEdit
        ? await sdk.update({ collection: 'workout-groups', id: initial!.id, data: body as unknown as WorkoutGroup })
        : await sdk.create({ collection: 'workout-groups', data: body as unknown as WorkoutGroup })
      toast.success(isEdit ? 'Grupa zaktualizowana' : 'Grupa dodana')
      onSaved(doc as unknown as Group)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd zapisu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={s.formBox}>
      <div style={{ ...s.label, fontWeight: 700, color: 'var(--theme-text)', marginBottom: 10 }}>
        {isEdit ? 'Edytuj grupę' : 'Nowa grupa'}
      </div>

      <div style={s.formRow}>
        <div style={{ flex: '1 1 200px' }}>
          <Field path="label" label="Nazwa grupy (opcjonalna)" value={label}
            onChange={(v) => { setLabel(v); clearError('label') }}
            placeholder="np. Superset górny, Część A" error={errors.label}
          />
        </div>
      </div>

      <div style={s.formRow}>
        <div style={{ flex: '1 1 140px' }}>
          <SelectField
            path="protocol"
            label="Protokół"
            value={protocol}
            onChange={(v) => { setProtocol(v); setErrors({}) }}
            options={PROTOCOLS}
            error={errors.protocol}
          />
        </div>

        {protocol !== 'amrap' && protocol !== 'tabata' && (
          <div style={{ flex: '1 1 80px' }}>
            <Field path="rounds" label="Serie / rundy" value={rounds}
              onChange={(v) => { setRounds(v); clearError('rounds') }}
              placeholder="np. 4, 1-3" error={errors.rounds}
            />
          </div>
        )}

        {protocol === 'amrap' && (
          <div style={{ flex: '1 1 80px' }}>
            <Field path="durationMinutes" label="Czas (min)" value={durationMinutes}
              onChange={(v) => { setDurationMinutes(v); clearError('durationMinutes') }}
              placeholder="10" error={errors.durationMinutes}
            />
          </div>
        )}

        {protocol === 'emom' && (
          <div style={{ flex: '1 1 80px' }}>
            <Field path="intervalSeconds" label="Interwał (s)" value={intervalSeconds}
              onChange={(v) => { setIntervalSeconds(v); clearError('intervalSeconds') }}
              error={errors.intervalSeconds}
            />
          </div>
        )}

        {protocol === 'tabata' && (
          <>
            <div style={{ flex: '1 1 70px' }}>
              <Field path="workSeconds" label="Praca (s)" value={workSeconds}
                onChange={(v) => { setWorkSeconds(v); clearError('workSeconds') }}
                error={errors.workSeconds}
              />
            </div>
            <div style={{ flex: '1 1 70px' }}>
              <Field path="restSeconds" label="Odpoczynek (s)" value={restSeconds}
                onChange={(v) => { setRestSeconds(v); clearError('restSeconds') }}
                error={errors.restSeconds}
              />
            </div>
          </>
        )}
      </div>

      <div style={s.formRow}>
        <div style={{ flex: '1 1 160px' }}>
          <Field path="restBetweenRounds" label="Przerwa między rundami" value={restBetweenRounds}
            onChange={(v) => { setRestBetweenRounds(v); clearError('restBetweenRounds') }}
            placeholder="np. 90 sek" error={errors.restBetweenRounds}
          />
        </div>
      </div>

      <div style={s.formActions}>
        <Button buttonStyle="secondary" margin={false} onClick={onCancel} disabled={saving}>Anuluj</Button>
        <Button buttonStyle="primary" margin={false} onClick={handleSave} disabled={saving}>
          {saving ? 'Zapisuję…' : isEdit ? 'Zapisz grupę' : 'Dodaj grupę'}
        </Button>
      </div>
    </div>
  )
}
