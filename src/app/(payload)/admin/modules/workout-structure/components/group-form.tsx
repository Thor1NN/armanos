'use client'

import React, { useState } from 'react'
import { FieldError, FieldLabel, TextInput, toast, useAuth, useDocumentInfo } from '@payloadcms/ui'
import type { Group } from '../types'
import { PROTOCOLS } from '../constants'
import { s } from '../styles'

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

type SelectOption = { value: string; label: string }

type SelectFieldProps = {
  path: string
  label: string
  value: string
  onChange: (v: string) => void
  options: SelectOption[]
  error?: string
}

function SelectField({ path, label, value, onChange, options, error }: SelectFieldProps) {
  return (
    <div>
      <FieldLabel label={label} htmlFor={path} required={false} />
      <select
        id={path}
        style={s.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <FieldError message={error} showError={!!error} />
    </div>
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
  const { token } = useAuth()
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

      const url = isEdit ? `/api/workout-groups/${initial!.id}` : '/api/workout-groups'
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.errors?.[0]?.message ?? 'Błąd zapisu')
      toast.success(isEdit ? 'Grupa zaktualizowana' : 'Grupa dodana')
      onSaved(data.doc)
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
        <button style={s.btnSecondary} onClick={onCancel} disabled={saving}>Anuluj</button>
        <button style={s.btnPrimary} onClick={handleSave} disabled={saving}>
          {saving ? 'Zapisuję…' : isEdit ? 'Zapisz grupę' : 'Dodaj grupę'}
        </button>
      </div>
    </div>
  )
}
