'use client'

import React, { useState } from 'react'
import { FieldError, FieldLabel, TextInput, toast, useAuth, useListDrawer } from '@payloadcms/ui'
import type { ExerciseRow } from '../types'
import { s } from '../styles'

type Errors = Partial<Record<string, string>>

function validate(fields: { reps: string; kg: string; rounds: string }): Errors {
  const errors: Errors = {}
  if (!fields.reps && !fields.kg) {
    errors.reps = 'Podaj powtórzenia lub obciążenie'
    errors.kg   = 'Podaj powtórzenia lub obciążenie'
  }
  if (fields.rounds && !/^[\d\-–]+$/.test(fields.rounds)) {
    errors.rounds = 'Format: liczba lub zakres (np. 4, 3–4)'
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

type Props = {
  groupId: number
  nextOrder: number
  initial?: ExerciseRow
  onSaved: (row: ExerciseRow) => void
  onCancel: () => void
}

export function ExerciseForm({ groupId, nextOrder, initial, onSaved, onCancel }: Props) {
  const { token } = useAuth()
  const isEdit = !!initial

  const [exerciseId, setExerciseId] = useState(initial?.exercise ? String(initial.exercise.id) : '')
  const [exerciseName, setExerciseName] = useState(initial?.exercise?.name ?? '')
  const [numer, setNumer]   = useState(initial?.numer  ?? '')
  const [rounds, setRounds] = useState(initial?.rounds ?? '')
  const [note, setNote]     = useState(initial?.note   ?? '')
  const [reps, setReps]     = useState(initial?.reps   ?? '')
  const [kg, setKg]         = useState(initial?.kg     ?? '')
  const [tut, setTut]       = useState(initial?.tut    ?? '')
  const [rir, setRir]       = useState(initial?.rir    ?? '')
  const [rest, setRest]     = useState(initial?.rest   ?? '')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  const [ListDrawer, ListDrawerToggler, { closeDrawer }] = useListDrawer({
    collectionSlugs: ['exercises'],
  })

  const clearError = (key: string) =>
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next })

  const handleSave = async () => {
    const validationErrors = validate({ reps, kg, rounds })
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        numer:    numer    || null,
        rounds:   rounds   || null,
        exercise: exerciseId ? Number(exerciseId) : null,
        note:     note     || null,
        reps:     reps     || null,
        kg:       kg       || null,
        tut:      tut      || null,
        rir:      rir      || null,
        rest:     rest     || null,
        ...(!isEdit && { group: groupId, order: nextOrder }),
      }
      const url = isEdit ? `/api/workout-exercise-rows/${initial!.id}` : '/api/workout-exercise-rows'
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.errors?.[0]?.message ?? 'Błąd zapisu')

      const exerciseObj = exerciseId
        ? { id: Number(exerciseId), name: exerciseName || null }
        : null
      const normalizedGroup =
        typeof data.doc.group === 'object' && data.doc.group !== null ? data.doc.group.id : data.doc.group

      toast.success(isEdit ? 'Ćwiczenie zaktualizowane' : 'Ćwiczenie dodane')
      onSaved({ ...data.doc, group: normalizedGroup, exercise: exerciseObj })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd zapisu')
    } finally {
      setSaving(false)
    }
  }

  const pickerStyle: React.CSSProperties = {
    ...s.select,
    textAlign: 'left',
    cursor: 'pointer',
    flex: 1,
    boxSizing: 'border-box',
  }

  return (
    <div style={s.formBox}>
      <div style={{ ...s.label, fontWeight: 700, color: 'var(--theme-text)', marginBottom: 10 }}>
        {isEdit ? 'Edytuj ćwiczenie' : 'Nowe ćwiczenie'}
      </div>

      <div style={s.formRow}>
        <div style={{ flex: '0 0 64px' }}>
          <Field path="numer" label="Numer" value={numer}
            onChange={(v) => { setNumer(v); clearError('numer') }}
            placeholder="1a" error={errors.numer}
          />
        </div>
        <div style={{ flex: '0 0 80px' }}>
          <Field path="rounds" label="Serie" value={rounds}
            onChange={(v) => { setRounds(v); clearError('rounds') }}
            placeholder="4" error={errors.rounds}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 3 }}>
            <FieldLabel label="Ćwiczenie (katalog)" />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <ListDrawerToggler style={pickerStyle}>
              {exerciseName || '— wybierz —'}
            </ListDrawerToggler>
            {exerciseId && (
              <button
                type='button'
                style={{ ...s.btnSecondary, padding: '5px 8px' }}
                onClick={() => { setExerciseId(''); setExerciseName('') }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={s.formRow}>
        <div style={{ flex: 1 }}>
          <Field path="note" label="Uwaga / wariant" value={note}
            onChange={(v) => { setNote(v); clearError('note') }}
            placeholder="opcjonalnie" error={errors.note}
          />
        </div>
      </div>

      <div style={s.formRow}>
        <div style={{ flex: '1 1 70px' }}>
          <Field path="reps" label="Powt." value={reps}
            onChange={(v) => { setReps(v); clearError('reps'); clearError('kg') }}
            placeholder="8" error={errors.reps}
          />
        </div>
        <div style={{ flex: '1 1 70px' }}>
          <Field path="kg" label="KG" value={kg}
            onChange={(v) => { setKg(v); clearError('kg'); clearError('reps') }}
            placeholder="60" error={errors.kg}
          />
        </div>
        <div style={{ flex: '1 1 70px' }}>
          <Field path="rir" label="RIR" value={rir}
            onChange={(v) => { setRir(v); clearError('rir') }}
            placeholder="2" error={errors.rir}
          />
        </div>
        <div style={{ flex: '1 1 70px' }}>
          <Field path="tut" label="TUT" value={tut}
            onChange={(v) => { setTut(v); clearError('tut') }}
            placeholder="3-0-1" error={errors.tut}
          />
        </div>
        <div style={{ flex: '1 1 90px' }}>
          <Field path="rest" label="Przerwa" value={rest}
            onChange={(v) => { setRest(v); clearError('rest') }}
            placeholder="90 sek" error={errors.rest}
          />
        </div>
      </div>

      <div style={s.formActions}>
        <button style={s.btnSecondary} onClick={onCancel} disabled={saving}>Anuluj</button>
        <button style={s.btnPrimary} onClick={handleSave} disabled={saving}>
          {saving ? 'Zapisuję…' : isEdit ? 'Zapisz ćwiczenie' : 'Dodaj ćwiczenie'}
        </button>
      </div>

      <ListDrawer
        onSelect={({ doc }) => {
          setExerciseId(String(doc.id))
          setExerciseName(String(doc.name ?? ''))
          closeDrawer()
        }}
      />
    </div>
  )
}
