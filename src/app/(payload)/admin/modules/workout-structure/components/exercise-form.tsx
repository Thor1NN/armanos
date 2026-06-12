'use client'

import React, { useState } from 'react'
import { toast, useAuth, useListDrawer } from '@payloadcms/ui'
import type { ExerciseRow } from '../types'
import { s } from '../styles'

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
  const [rounds, setRounds] = useState(initial?.rounds ?? '')
  const [numer, setNumer] = useState(initial?.numer ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [reps, setReps] = useState(initial?.reps ?? '')
  const [kg, setKg] = useState(initial?.kg ?? '')
  const [tut, setTut] = useState(initial?.tut ?? '')
  const [rir, setRir] = useState(initial?.rir ?? '')
  const [rest, setRest] = useState(initial?.rest ?? '')
  const [saving, setSaving] = useState(false)

  const [ListDrawer, ListDrawerToggler, { closeDrawer }] = useListDrawer({
    collectionSlugs: ['exercises'],
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        rounds: rounds || null,
        numer: numer || null,
        exercise: exerciseId ? Number(exerciseId) : null,
        note: note || null,
        reps: reps || null,
        kg: kg || null,
        tut: tut || null,
        rir: rir || null,
        rest: rest || null,
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
      <div style={{ ...s.label, fontSize: 12, fontWeight: 700, color: '#E8E8E8', marginBottom: 10 }}>
        {isEdit ? 'Edytuj ćwiczenie' : 'Nowe ćwiczenie'}
      </div>

      <div style={s.formRow}>
        <div style={{ flex: '0 0 64px' }}>
          <label style={s.label}>Numer</label>
          <input style={s.input} value={numer} onChange={(e) => setNumer(e.target.value)} placeholder='1a' />
        </div>
        <div style={{ flex: '0 0 70px' }}>
          <label style={s.label}>Serie</label>
          <input style={s.input} value={rounds} onChange={(e) => setRounds(e.target.value)} placeholder='4' />
        </div>
        <div style={{ flex: 1 }}>
          <label style={s.label}>Ćwiczenie (katalog)</label>
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
          <label style={s.label}>Uwaga / wariant</label>
          <input style={s.input} value={note} onChange={(e) => setNote(e.target.value)} placeholder='opcjonalnie' />
        </div>
      </div>

      <div style={s.formRow}>
        <div style={{ flex: '1 1 70px' }}>
          <label style={s.label}>Powt.</label>
          <input style={s.input} value={reps} onChange={(e) => setReps(e.target.value)} placeholder='8' />
        </div>
        <div style={{ flex: '1 1 70px' }}>
          <label style={s.label}>KG</label>
          <input style={s.input} value={kg} onChange={(e) => setKg(e.target.value)} placeholder='60' />
        </div>
        <div style={{ flex: '1 1 70px' }}>
          <label style={s.label}>RIR</label>
          <input style={s.input} value={rir} onChange={(e) => setRir(e.target.value)} placeholder='2' />
        </div>
        <div style={{ flex: '1 1 70px' }}>
          <label style={s.label}>TUT</label>
          <input style={s.input} value={tut} onChange={(e) => setTut(e.target.value)} placeholder='3-0-1' />
        </div>
        <div style={{ flex: '1 1 90px' }}>
          <label style={s.label}>Przerwa</label>
          <input style={s.input} value={rest} onChange={(e) => setRest(e.target.value)} placeholder='90 sek' />
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
