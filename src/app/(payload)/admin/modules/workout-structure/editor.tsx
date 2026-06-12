'use client'

import React, { useState } from 'react'
import { toast, useAuth } from '@payloadcms/ui'
import type { ExerciseRow, Group, Section } from './types'
import { PROTOCOL_LABEL } from './constants'
import { exerciseLabel, exerciseMeta, groupLabel } from './utils'
import { s } from './styles'
import { GroupForm } from './components/group-form'
import { ExerciseForm } from './components/exercise-form'

type Props = {
  sections: Section[]
  initialGroups: Group[]
  initialExerciseRows: ExerciseRow[]
  hasLogs?: boolean
}

export function WorkoutStructureEditor({
  sections,
  initialGroups,
  initialExerciseRows,
  hasLogs = false,
}: Props) {
  const { token } = useAuth()
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
        headers: { Authorization: `JWT ${token}` },
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data?.errors?.[0]?.message ?? 'Nie można usunąć grupy')
        return
      }
      setGroups((prev) => prev.filter((g) => g.id !== groupId))
      setExerciseRows((prev) => prev.filter((r) => r.group !== groupId))
      toast.success('Grupa usunięta')
    } finally {
      setDeletingGroup(null)
    }
  }

  const handleDeleteExercise = async (rowId: number) => {
    setDeletingExercise(rowId)
    try {
      const res = await fetch(`/api/workout-exercise-rows/${rowId}`, {
        method: 'DELETE',
        headers: { Authorization: `JWT ${token}` },
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data?.errors?.[0]?.message ?? 'Nie można usunąć ćwiczenia')
        return
      }
      setExerciseRows((prev) => prev.filter((r) => r.id !== rowId))
      toast.success('Ćwiczenie usunięte')
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
