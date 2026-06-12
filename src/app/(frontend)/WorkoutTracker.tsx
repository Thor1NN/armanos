'use client'

import React, { useEffect, useRef, useState } from 'react'
import type { MetricField } from '../../trackingTypes'
import { mutedTextClass, panelClass, sectionLabelClass } from './ui'
import { ExerciseRow } from './components/workout/ExerciseRow'
import { SessionTimesBadge, SessionTimesForm } from './components/workout/SessionTimes'
import type { Session, SetLog, TExercise, TWorkout, Values } from './components/workout/types'
import { metricBody } from './components/workout/utils'

export type { TWorkout } from './components/workout/types'

const api = {
  async findSession(workoutId: number): Promise<Session | null> {
    const res = await fetch(
      `/api/workout-logs?where[workout][equals]=${workoutId}&limit=1&depth=0&sort=-updatedAt`,
      { credentials: 'same-origin', cache: 'no-store' },
    )
    const data = await res.json()
    return data.docs?.[0] ?? null
  },
  async createSession(workoutId: number): Promise<Session> {
    const res = await fetch('/api/workout-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ workout: workoutId }),
    })
    return (await res.json()).doc
  },
  async patchSession(id: number, body: Record<string, unknown>): Promise<Session> {
    const res = await fetch(`/api/workout-logs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    })
    return (await res.json()).doc
  },
  async loadSets(sessionId: number): Promise<SetLog[]> {
    const res = await fetch(
      `/api/set-logs?where[session][equals]=${sessionId}&limit=500&depth=0&sort=setNumber`,
      { credentials: 'same-origin', cache: 'no-store' },
    )
    return (await res.json()).docs ?? []
  },
  async addSet(body: Record<string, unknown>): Promise<SetLog> {
    const res = await fetch('/api/set-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    })
    return (await res.json()).doc
  },
  async updateSet(id: number, body: Record<string, unknown>): Promise<SetLog> {
    const res = await fetch(`/api/set-logs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    })
    return (await res.json()).doc
  },
  async deleteSet(id: number) {
    await fetch(`/api/set-logs/${id}`, { method: 'DELETE', credentials: 'same-origin' })
  },
}

export default function WorkoutTracker({ workout }: { workout: TWorkout }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sets, setSets] = useState<SetLog[]>([])
  const [timeEditorOpen, setTimeEditorOpen] = useState(false)
  const [loadedWorkoutId, setLoadedWorkoutId] = useState<number | null>(null)

  const hasLoadedWorkout = loadedWorkoutId === workout.id
  const displayedSession = hasLoadedWorkout ? session : null
  const displayedSets = hasLoadedWorkout ? sets : []

  useEffect(() => {
    let active = true

    api.findSession(workout.id).then(async (s) => {
      if (!active) return

      if (!s) {
        setSession(null)
        setSets([])
        setLoadedWorkoutId(workout.id)
        return
      }

      setSession(s)

      const loadedSets = await api.loadSets(s.id)
      if (!active) return

      setSets(loadedSets)
      setLoadedWorkoutId(workout.id)
    })

    return () => {
      active = false
    }
  }, [workout.id])

  const creating = useRef<Promise<Session> | null>(null)
  const ensureSession = async (): Promise<Session> => {
    if (displayedSession) return displayedSession
    if (!creating.current) {
      creating.current = api.createSession(workout.id).then((s) => {
        setSession(s)
        setLoadedWorkoutId(workout.id)
        return s
      })
    }
    return creating.current
  }

  const setTime = async (field: 'startedAt' | 'finishedAt', iso: string | null) => {
    const s = await ensureSession()
    setSession(await api.patchSession(s.id, { [field]: iso }))
  }

  const saveTimes = async (startedAt: string | null, finishedAt: string | null) => {
    const s = await ensureSession()
    setSession(await api.patchSession(s.id, { startedAt, finishedAt }))
  }

  const setsForRow = (rowId: string) =>
    displayedSets
      .filter((s) => s.workoutExerciseRowId === rowId)
      .sort((a, b) => (a.setNumber ?? 0) - (b.setNumber ?? 0))

  const onAdd = async (ex: TExercise, fields: MetricField[], v: Values) => {
    const s = await ensureSession()
    const setNumber = setsForRow(ex.rowId).length + 1
    const doc = await api.addSet({
      session: s.id,
      exercise: ex.exerciseId ?? undefined,
      exerciseName: ex.exerciseName,
      workoutExerciseRowId: ex.rowId,
      setNumber,
      ...metricBody(fields, v),
    })
    setSets((prev) => [...prev, doc])
  }

  const onUpdate = async (id: number, fields: MetricField[], v: Values) => {
    const doc = await api.updateSet(id, metricBody(fields, v))
    setSets((prev) => prev.map((s) => (s.id === id ? { ...s, ...doc } : s)))
  }

  const onDelete = async (id: number) => {
    await api.deleteSet(id)
    setSets((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className={`mb-3 px-4 py-3 ${panelClass}`}>
      <div className="flex items-center justify-between gap-3 text-sm font-semibold text-app-text">
        <span>
          <span className="break-words">{workout.title}</span>
          {workout.rpe != null && <span className={mutedTextClass}> · RPE {workout.rpe}</span>}
        </span>
        <SessionTimesBadge
          session={displayedSession}
          open={timeEditorOpen}
          onOpen={() => setTimeEditorOpen(true)}
        />
      </div>

      {timeEditorOpen && (
        <SessionTimesForm
          session={displayedSession}
          onSet={setTime}
          onSave={saveTimes}
          onClose={() => setTimeEditorOpen(false)}
        />
      )}

      {workout.sections.map((section, si) => (
        <div className="mt-3" key={si}>
          {(section.title || section.subtitle) && (
            <div className="mb-2 text-sm font-semibold text-app-accent">
              {section.title}
              {section.subtitle ? ` · ${section.subtitle}` : ''}
            </div>
          )}
          {section.groups.map((group, gi) => (
            <div className="my-2 mb-3" key={gi}>
              {group.setType && <div className={`mb-1 ${sectionLabelClass}`}>{group.setType}</div>}
              {group.exercises.map((ex) => (
                <ExerciseRow
                  key={ex.rowId}
                  ex={ex}
                  sets={setsForRow(ex.rowId)}
                  onAdd={onAdd}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
            </div>
          ))}
        </div>
      ))}

      {hasLoadedWorkout && !displayedSession && (
        <div className={`mt-3 text-xs ${mutedTextClass}`}>
          Brak zapisanych serii dla tego treningu. Dodanie pierwszej serii utworzy sesję automatycznie.
        </div>
      )}
    </div>
  )
}
