'use client'

import React, { useState } from 'react'
import type { ExerciseCatalogItem, ExerciseRow } from '../types'
import { s } from '../styles'

type Props = {
  groupId: number
  nextOrder: number
  exerciseCatalog: ExerciseCatalogItem[]
  initial?: ExerciseRow
  onSaved: (row: ExerciseRow) => void
  onCancel: () => void
}

export function ExerciseForm({ groupId, nextOrder, exerciseCatalog, initial, onSaved, onCancel }: Props) {
  const isEdit = !!initial
  const [exerciseId, setExerciseId] = useState(initial?.exercise ? String(initial.exercise.id) : '')
  const [rounds, setRounds] = useState(initial?.rounds ?? '')
  const [numer, setNumer] = useState(initial?.numer ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [reps, setReps] = useState(initial?.reps ?? '')
  const [kg, setKg] = useState(initial?.kg ?? '')
  const [tut, setTut] = useState(initial?.tut ?? '')
  const [rir, setRir] = useState(initial?.rir ?? '')
  const [rest, setRest] = useState(initial?.rest ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.errors?.[0]?.message ?? 'Błąd zapisu')

      const exerciseObj = exerciseId
        ? { id: Number(exerciseId), name: exerciseCatalog.find((e) => e.id === Number(exerciseId))?.name ?? null }
        : null

      onSaved({ ...data.doc, exercise: exerciseObj })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Błąd zapisu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={s.formBox}>
      <div style={{ ...s.label, fontSize: 12, fontWeight: 700, color: '#E8E8E8', marginBottom: 10 }}>
        {isEdit ? 'Edytuj ćwiczenie' : 'Nowe ćwiczenie'}
      </div>
      {error && <div style={s.errorMsg}>{error}</div>}

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
          <select style={s.select} value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
            <option value=''>— wybierz —</option>
            {exerciseCatalog.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
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
    </div>
  )
}
