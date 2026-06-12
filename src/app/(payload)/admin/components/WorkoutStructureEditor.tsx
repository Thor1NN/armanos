'use client'

import React, { useState } from 'react'
import type { ExerciseCatalogItem, ExerciseRow, Group, Section } from './types'

type Props = {
  workoutId: number
  sections: Section[]
  initialGroups: Group[]
  initialExerciseRows: ExerciseRow[]
  exerciseCatalog: ExerciseCatalogItem[]
  hasLogs?: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROTOCOLS = [
  { value: 'standard', label: 'Standard' },
  { value: 'emom', label: 'EMOM' },
  { value: 'amrap', label: 'AMRAP' },
  { value: 'for_time', label: 'For Time' },
  { value: 'tabata', label: 'Tabata' },
]

const PROTOCOL_LABEL: Record<string, string> = {
  standard: 'Standard',
  emom: 'EMOM',
  amrap: 'AMRAP',
  for_time: 'For Time',
  tabata: 'Tabata',
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  container: { padding: '20px 24px', fontFamily: 'inherit' } as React.CSSProperties,
  sectionBlock: { marginBottom: 28 } as React.CSSProperties,
  sectionHeader: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#6E52EB',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottom: '1px solid #2E3138',
  },
  groupCard: {
    background: '#1A1C23',
    border: '1px solid #2E3138',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  } as React.CSSProperties,
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: '#1E2028',
    borderBottom: '1px solid #2E3138',
  } as React.CSSProperties,
  groupTitle: { fontSize: 12, fontWeight: 600, color: '#E8E8E8' } as React.CSSProperties,
  groupMeta: { fontSize: 11, color: '#9A9FA8', marginLeft: 8 } as React.CSSProperties,
  exerciseRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '7px 12px',
    borderBottom: '1px solid #23252D',
    gap: 8,
  } as React.CSSProperties,
  exerciseNumer: { fontSize: 11, fontWeight: 700, color: '#6E52EB', minWidth: 28 } as React.CSSProperties,
  exerciseName: { fontSize: 13, color: '#E8E8E8', flex: 1 } as React.CSSProperties,
  exerciseMeta: { fontSize: 11, color: '#9A9FA8' } as React.CSSProperties,
  btnDanger: {
    background: 'transparent',
    border: 'none',
    color: '#EF4444',
    cursor: 'pointer',
    fontSize: 11,
    padding: '2px 6px',
    borderRadius: 4,
  } as React.CSSProperties,
  btnAdd: {
    background: 'transparent',
    border: '1px dashed #3E4149',
    color: '#9A9FA8',
    cursor: 'pointer',
    fontSize: 12,
    padding: '6px 12px',
    borderRadius: 6,
    width: '100%',
    textAlign: 'left' as const,
    marginTop: 4,
  },
  btnPrimary: {
    background: '#6E52EB',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    padding: '6px 14px',
    borderRadius: 6,
    fontWeight: 600,
  } as React.CSSProperties,
  btnSecondary: {
    background: 'transparent',
    border: '1px solid #3E4149',
    color: '#9A9FA8',
    cursor: 'pointer',
    fontSize: 12,
    padding: '6px 14px',
    borderRadius: 6,
  } as React.CSSProperties,
  formBox: {
    background: '#13141A',
    border: '1px solid #2E3138',
    borderRadius: 8,
    padding: '12px 14px',
    marginTop: 8,
  } as React.CSSProperties,
  formRow: { display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 8 } as React.CSSProperties,
  label: { fontSize: 11, color: '#9A9FA8', display: 'block', marginBottom: 3 } as React.CSSProperties,
  input: {
    background: '#1A1C23',
    border: '1px solid #2E3138',
    borderRadius: 5,
    color: '#E8E8E8',
    fontSize: 13,
    padding: '5px 8px',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  select: {
    background: '#1A1C23',
    border: '1px solid #2E3138',
    borderRadius: 5,
    color: '#E8E8E8',
    fontSize: 13,
    padding: '5px 8px',
    width: '100%',
  },
  formActions: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 } as React.CSSProperties,
  empty: { fontSize: 12, color: '#9A9FA8', padding: '8px 12px', fontStyle: 'italic' as const },
  errorMsg: { fontSize: 12, color: '#EF4444', marginBottom: 8 },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const groupLabel = (g: Group): string => {
  const p = g.protocol ?? 'standard'
  const r = g.rounds
  const d = g.durationMinutes
  if (p === 'emom') return r ? `EMOM · ${r} min` : 'EMOM'
  if (p === 'amrap') return d ? `AMRAP · ${d} min` : 'AMRAP'
  if (p === 'for_time') return r ? `For Time · ${r} rund` : 'For Time'
  if (p === 'tabata') return 'Tabata'
  return r ? `${r} serie` : 'Standard'
}

const exerciseLabel = (row: ExerciseRow): string =>
  row.exercise?.name ?? row.note ?? '—'

const exerciseMeta = (row: ExerciseRow): string => {
  const parts: string[] = []
  if (row.rounds) parts.push(`${row.rounds} serie`)
  if (row.reps) parts.push(`${row.reps} powt.`)
  if (row.kg) parts.push(`${row.kg} kg`)
  if (row.rir) parts.push(`RIR ${row.rir}`)
  if (row.tut) parts.push(`TUT ${row.tut}`)
  if (row.rest) parts.push(`przerwa ${row.rest}`)
  return parts.join(' · ')
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GroupForm({
  sectionRowId,
  workoutId,
  nextOrder,
  initial,
  onSaved,
  onCancel,
}: {
  sectionRowId: string | undefined
  workoutId: number
  nextOrder: number
  initial?: Group
  onSaved: (group: Group) => void
  onCancel: () => void
}) {
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
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
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
        ...(!isEdit && { workout: workoutId, sectionRowId: sectionRowId ?? '', order: nextOrder }),
      }

      const url = isEdit ? `/api/workout-groups/${initial!.id}` : '/api/workout-groups'
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.errors?.[0]?.message ?? 'Błąd zapisu')
      onSaved(data.doc)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Błąd zapisu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={s.formBox}>
      <div style={{ ...s.label, fontSize: 12, fontWeight: 700, color: '#E8E8E8', marginBottom: 10 }}>
        {isEdit ? 'Edytuj grupę' : 'Nowa grupa'}
      </div>
      {error && <div style={s.errorMsg}>{error}</div>}

      <div style={s.formRow}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={s.label}>Nazwa grupy (opcjonalna)</label>
          <input style={s.input} value={label} onChange={(e) => setLabel(e.target.value)} placeholder='np. Superset górny, Część A' />
        </div>
      </div>

      <div style={s.formRow}>
        <div style={{ flex: '1 1 140px' }}>
          <label style={s.label}>Protokół</label>
          <select style={s.select} value={protocol} onChange={(e) => setProtocol(e.target.value)}>
            {PROTOCOLS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {protocol !== 'amrap' && protocol !== 'tabata' && (
          <div style={{ flex: '1 1 80px' }}>
            <label style={s.label}>Serie / rundy</label>
            <input style={s.input} value={rounds} onChange={(e) => setRounds(e.target.value)} placeholder='np. 4, 1-3' />
          </div>
        )}

        {protocol === 'amrap' && (
          <div style={{ flex: '1 1 80px' }}>
            <label style={s.label}>Czas (min)</label>
            <input style={s.input} type='number' value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder='10' />
          </div>
        )}

        {protocol === 'emom' && (
          <div style={{ flex: '1 1 80px' }}>
            <label style={s.label}>Interwał (s)</label>
            <input style={s.input} type='number' value={intervalSeconds} onChange={(e) => setIntervalSeconds(e.target.value)} />
          </div>
        )}

        {protocol === 'tabata' && (
          <>
            <div style={{ flex: '1 1 70px' }}>
              <label style={s.label}>Praca (s)</label>
              <input style={s.input} type='number' value={workSeconds} onChange={(e) => setWorkSeconds(e.target.value)} />
            </div>
            <div style={{ flex: '1 1 70px' }}>
              <label style={s.label}>Odpoczynek (s)</label>
              <input style={s.input} type='number' value={restSeconds} onChange={(e) => setRestSeconds(e.target.value)} />
            </div>
          </>
        )}
      </div>

      <div style={s.formRow}>
        <div style={{ flex: '1 1 160px' }}>
          <label style={s.label}>Przerwa między rundami</label>
          <input style={s.input} value={restBetweenRounds} onChange={(e) => setRestBetweenRounds(e.target.value)} placeholder='np. 90 sek' />
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

function ExerciseForm({
  groupId,
  nextOrder,
  exerciseCatalog,
  initial,
  onSaved,
  onCancel,
}: {
  groupId: number
  nextOrder: number
  exerciseCatalog: ExerciseCatalogItem[]
  initial?: ExerciseRow
  onSaved: (row: ExerciseRow) => void
  onCancel: () => void
}) {
  const isEdit = !!initial
  const [exerciseId, setExerciseId] = useState(
    initial?.exercise ? String(initial.exercise.id) : '',
  )
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
      const url = isEdit
        ? `/api/workout-exercise-rows/${initial!.id}`
        : '/api/workout-exercise-rows'
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

// ─── Main component ───────────────────────────────────────────────────────────

export function WorkoutStructureEditor({
  workoutId,
  sections,
  initialGroups,
  initialExerciseRows,
  exerciseCatalog,
  hasLogs = false,
}: Props) {
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [exerciseRows, setExerciseRows] = useState<ExerciseRow[]>(initialExerciseRows)
  const [addingGroupFor, setAddingGroupFor] = useState<string | null>(null)
  const [editingGroup, setEditingGroup] = useState<number | null>(null)
  const [addingExerciseFor, setAddingExerciseFor] = useState<number | null>(null)
  const [editingExercise, setEditingExercise] = useState<number | null>(null)
  const [deletingGroup, setDeletingGroup] = useState<number | null>(null)
  const [deletingExercise, setDeletingExercise] = useState<number | null>(null)

  const sectionsWithFallback: Section[] =
    sections.length > 0 ? sections : [{ id: undefined, title: null, subtitle: null }]

  const groupsForSection = (sectionId: string | undefined) =>
    groups.filter((g) => g.sectionRowId === (sectionId ?? ''))

  const rowsForGroup = (groupId: number) =>
    exerciseRows.filter((r) => r.group === groupId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const handleDeleteGroup = async (groupId: number) => {
    setDeletingGroup(groupId)
    try {
      const res = await fetch(`/api/workout-groups/${groupId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data?.errors?.[0]?.message ?? 'Nie można usunąć grupy')
        return
      }
      setGroups((prev) => prev.filter((g) => g.id !== groupId))
      setExerciseRows((prev) => prev.filter((r) => r.group !== groupId))
    } finally {
      setDeletingGroup(null)
    }
  }

  const handleDeleteExercise = async (rowId: number) => {
    setDeletingExercise(rowId)
    try {
      const res = await fetch(`/api/workout-exercise-rows/${rowId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data?.errors?.[0]?.message ?? 'Nie można usunąć ćwiczenia')
        return
      }
      setExerciseRows((prev) => prev.filter((r) => r.id !== rowId))
    } finally {
      setDeletingExercise(null)
    }
  }

  return (
    <div style={s.container}>
      {sectionsWithFallback.map((section, si) => {
        const sectionGroups = groupsForSection(section.id)
        const sectionKey = section.id ?? `no-section-${si}`
        const sectionLabel =
          [section.title, section.subtitle].filter(Boolean).join(' · ') || 'Sekcja bez tytułu'

        return (
          <div key={sectionKey} style={s.sectionBlock}>
            <div style={s.sectionHeader}>
              {sections.length > 0 ? sectionLabel : 'Grupy treningu'}
            </div>

            {sectionGroups.length === 0 && (
              <div style={s.empty}>Brak grup w tej sekcji.</div>
            )}

            {sectionGroups.map((group) => {
              const rows = rowsForGroup(group.id)

              return (
                <div key={group.id} style={s.groupCard}>
                  {editingGroup === group.id ? (
                    <GroupForm
                      sectionRowId={group.sectionRowId ?? undefined}
                      workoutId={workoutId}
                      nextOrder={group.order ?? 0}
                      initial={group}
                      onSaved={(updated) => {
                        setGroups((prev) => prev.map((g) => g.id === updated.id ? { ...g, ...updated } : g))
                        setEditingGroup(null)
                      }}
                      onCancel={() => setEditingGroup(null)}
                    />
                  ) : (
                    <div style={s.groupHeader}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={s.groupTitle}>{group.label ?? PROTOCOL_LABEL[group.protocol ?? 'standard'] ?? group.protocol}</span>
                        <span style={s.groupMeta}>{groupLabel(group)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          style={s.btnSecondary}
                          onClick={() => {
                            setAddingGroupFor(null)
                            setAddingExerciseFor(null)
                            setEditingExercise(null)
                            setEditingGroup(group.id)
                          }}
                        >
                          Edytuj grupę
                        </button>
                        {!hasLogs && (
                          <button
                            style={s.btnDanger}
                            disabled={deletingGroup === group.id}
                            onClick={() => {
                              if (confirm('Usunąć grupę i wszystkie jej ćwiczenia?')) {
                                handleDeleteGroup(group.id)
                              }
                            }}
                          >
                            {deletingGroup === group.id ? '…' : 'Usuń grupę'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {rows.length === 0 && editingGroup !== group.id && <div style={s.empty}>Brak ćwiczeń.</div>}

                  {rows.map((row) => (
                    <div key={row.id}>
                      {editingExercise === row.id ? (
                        <div style={{ padding: '6px 12px' }}>
                          <ExerciseForm
                            groupId={group.id}
                            nextOrder={row.order ?? 0}
                            exerciseCatalog={exerciseCatalog}
                            initial={row}
                            onSaved={(updated) => {
                              setExerciseRows((prev) => prev.map((r) => r.id === updated.id ? { ...r, ...updated } : r))
                              setEditingExercise(null)
                            }}
                            onCancel={() => setEditingExercise(null)}
                          />
                        </div>
                      ) : (
                        <div style={row.id === rows[rows.length - 1]?.id ? { ...s.exerciseRow, borderBottom: 'none' } : s.exerciseRow}>
                          <span style={s.exerciseNumer}>{row.numer ?? '—'}</span>
                          <span style={s.exerciseName}>{exerciseLabel(row)}</span>
                          <span style={s.exerciseMeta}>{exerciseMeta(row)}</span>
                          <button
                            style={{ ...s.btnSecondary, fontSize: 11, padding: '2px 6px' }}
                            onClick={() => {
                              setAddingExerciseFor(null)
                              setEditingGroup(null)
                              setEditingExercise(row.id)
                            }}
                          >
                            Edytuj
                          </button>
                          {!hasLogs && (
                            <button
                              style={s.btnDanger}
                              disabled={deletingExercise === row.id}
                              onClick={() => {
                                if (confirm(`Usunąć ćwiczenie "${exerciseLabel(row)}"?`)) {
                                  handleDeleteExercise(row.id)
                                }
                              }}
                            >
                              {deletingExercise === row.id ? '…' : 'Usuń'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  <div style={{ padding: '6px 12px 10px' }}>
                    {addingExerciseFor === group.id ? (
                      <ExerciseForm
                        groupId={group.id}
                        nextOrder={rows.length}
                        exerciseCatalog={exerciseCatalog}
                        onSaved={(row) => {
                          setExerciseRows((prev) => [...prev, row])
                          setAddingExerciseFor(null)
                        }}
                        onCancel={() => setAddingExerciseFor(null)}
                      />
                    ) : (
                      <button style={s.btnAdd} onClick={() => {
                        setEditingExercise(null)
                        setAddingExerciseFor(group.id)
                      }}>
                        + Dodaj ćwiczenie
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            <div style={{ marginTop: 8 }}>
              {addingGroupFor === sectionKey ? (
                <GroupForm
                  sectionRowId={section.id}
                  workoutId={workoutId}
                  nextOrder={sectionGroups.length}
                  onSaved={(group) => {
                    setGroups((prev) => [...prev, group])
                    setAddingGroupFor(null)
                  }}
                  onCancel={() => setAddingGroupFor(null)}
                />
              ) : (
                <button style={s.btnAdd} onClick={() => setAddingGroupFor(sectionKey)}>
                  + Dodaj grupę do tej sekcji
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
