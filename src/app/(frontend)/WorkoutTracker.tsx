'use client'

import React, { useEffect, useRef, useState } from 'react'
import { METRIC_FIELDS, trackingFields, type MetricField } from '../../trackingTypes'
import {
  compactInputClass,
  compactUnitInputClass,
  dangerIconButtonClass,
  dashedButtonClass,
  iconButtonClass,
  inputClass,
  joinClasses,
  mutedTextClass,
  panelClass,
  primaryButtonClass,
  secondaryButtonClass,
  sectionLabelClass,
  selectClass,
} from './ui'

export type TExercise = {
  rowId: string
  numer?: string | null
  name: string
  note?: string | null
  exerciseId?: number | null
  exerciseName: string
  trackingType?: string | null
  videoUrl?: string | null
  meta: string[]
  prefill: { reps?: string | null; rir?: string | null }
}
export type TGroup = { setType?: string | null; exercises: TExercise[] }
export type TSection = { title?: string | null; subtitle?: string | null; groups: TGroup[] }
export type TWorkout = { id: number; title: string; rpe?: number | null; sections: TSection[] }

type Session = { id: number; startedAt?: string | null; finishedAt?: string | null }
type SetLog = {
  id: number
  workoutExerciseRowId?: string | null
  setNumber?: number | null
  weight?: number | null
  distanceM?: number | null
  durationSec?: number | null
  reps?: string | null
  rir?: string | null
  note?: string | null
}
type Values = Record<string, string>

const api = {
  async findSession(workoutId: number): Promise<Session | null> {
    const res = await fetch(
      `/api/workout-logs?where[workout][equals]=${workoutId}&limit=1&depth=0`,
      { credentials: 'same-origin' },
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
      { credentials: 'same-origin' },
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

const fmtDuration = (start?: string | null, end?: string | null): string | null => {
  if (!start || !end) return null
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 0) return null
  const totalMin = Math.round(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h ? `${h} h ${m} min` : `${m} min`
}

const pad2 = (n: number) => String(n).padStart(2, '0')
const isoToDateInput = (iso?: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}
const isoToTimeInput = (iso?: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}
const combineDateTime = (date: string, time: string): string | null => {
  if (!date && !time) return null
  const d = date || isoToDateInput(new Date().toISOString())
  const t = time || '00:00'
  return new Date(`${d}T${t}`).toISOString()
}

const metricBody = (fields: MetricField[], v: Values): Record<string, unknown> => {
  const body: Record<string, unknown> = {}
  for (const f of fields) {
    const meta = METRIC_FIELDS[f]
    if (meta.composite === 'duration') {
      const mins = (v[`${f}__min`] ?? '').trim()
      const secs = (v[`${f}__sec`] ?? '').trim()
      body[f] = mins === '' && secs === '' ? null : (Number(mins) || 0) * 60 + (Number(secs) || 0)
      continue
    }
    const raw = (v[f] ?? '').trim()
    if (raw === '') {
      body[f] = null
    } else if (meta.units) {
      const unit = v[`${f}__unit`] || meta.units.default
      const factor = meta.units.options.find((o) => o.value === unit)?.factor ?? 1
      body[f] = Number(raw) * factor
    } else {
      body[f] = meta.numeric ? Number(raw) : raw
    }
  }
  body.note = v.note?.trim() || null
  return body
}

const toDefaultUnit = (f: MetricField, base: number): { value: string; unit: string } => {
  const meta = METRIC_FIELDS[f]
  if (!meta.units) return { value: String(base), unit: '' }
  const unit = meta.units.default
  const factor = meta.units.options.find((o) => o.value === unit)?.factor ?? 1
  return { value: String(base / factor), unit }
}

const fmtSec = (s: number): string => {
  if (s < 60) return `${s} s`
  const m = Math.floor(s / 60)
  const rest = s % 60
  return rest ? `${m} min ${rest} s` : `${m} min`
}

const setSummary = (s: SetLog): string => {
  const parts: string[] = []
  if (s.weight != null) parts.push(`${s.weight} kg`)
  if (s.distanceM != null) parts.push(`${s.distanceM} m`)
  if (s.durationSec != null) parts.push(fmtSec(s.durationSec))
  if (s.reps) parts.push(`× ${s.reps}`)
  if (s.rir) parts.push(`RIR ${s.rir}`)
  if (s.note) parts.push(s.note)
  return parts.length ? parts.join(' · ') : '—'
}

export default function WorkoutTracker({ workout }: { workout: TWorkout }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sets, setSets] = useState<SetLog[]>([])

  useEffect(() => {
    let active = true
    api.findSession(workout.id).then(async (s) => {
      if (!active || !s) return
      setSession(s)
      setSets(await api.loadSets(s.id))
    })
    return () => {
      active = false
    }
  }, [workout.id])

  const creating = useRef<Promise<Session> | null>(null)
  const ensureSession = async (): Promise<Session> => {
    if (session) return session
    if (!creating.current) {
      creating.current = api.createSession(workout.id).then((s) => {
        setSession(s)
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
    sets
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
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-sm font-semibold text-app-text">
        <span>
          <span className="break-words">{workout.title}</span>
          {workout.rpe != null && <span className={mutedTextClass}> · RPE {workout.rpe}</span>}
        </span>
        <SessionTimes session={session} onSet={setTime} onSave={saveTimes} />
      </div>

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
              {group.setType && (
                <div className={`mb-1 ${sectionLabelClass}`}>{group.setType}</div>
              )}
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
    </div>
  )
}

function SessionTimes({
  session,
  onSet,
  onSave,
}: {
  session: Session | null
  onSet: (field: 'startedAt' | 'finishedAt', iso: string | null) => void
  onSave: (startedAt: string | null, finishedAt: string | null) => Promise<void>
}) {
  const startIso = session?.startedAt ?? null
  const finishIso = session?.finishedAt ?? null

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sd, setSd] = useState(() => isoToDateInput(startIso))
  const [st, setSt] = useState(() => isoToTimeInput(startIso))
  const [ed, setEd] = useState(() => isoToDateInput(finishIso))
  const [et, setEt] = useState(() => isoToTimeInput(finishIso))

  const [prevStart, setPrevStart] = useState(startIso)
  if (startIso !== prevStart) {
    setPrevStart(startIso)
    setSd(isoToDateInput(startIso))
    setSt(isoToTimeInput(startIso))
  }
  const [prevFinish, setPrevFinish] = useState(finishIso)
  if (finishIso !== prevFinish) {
    setPrevFinish(finishIso)
    setEd(isoToDateInput(finishIso))
    setEt(isoToTimeInput(finishIso))
  }

  const save = async () => {
    setSaving(true)
    try {
      await onSave(combineDateTime(sd, st), combineDateTime(ed, et))
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    const duration = fmtDuration(startIso, finishIso)
    const compact = (iso: string | null) =>
      iso ? `${isoToDateInput(iso).slice(5).replace('-', '.')} ${isoToTimeInput(iso)}` : null
    const s = compact(startIso)
    const e = compact(finishIso)

    return (
      <button
        type="button"
        className={joinClasses(
          secondaryButtonClass,
          'rounded-full bg-app-panel px-3 py-1.5 text-xs font-normal text-app-text',
        )}
        onClick={() => setOpen(true)}
      >
        {s || e ? (
          <>
            <span>🕒 {s ?? '—'}{e ? ` – ${e}` : ''}</span>
            {duration && <span className="font-semibold text-app-accent">{duration}</span>}
          </>
        ) : (
          <span className={mutedTextClass}>＋ Czas treningu</span>
        )}
      </button>
    )
  }

  return (
    <div className={`mt-1 basis-full p-3 font-normal ${panelClass}`}>
      <div className="flex flex-wrap items-center gap-1.5 text-sm">
        <span className={`w-[86px] shrink-0 text-xs ${mutedTextClass}`}>Rozpoczęto</span>
        <input
          className={inputClass}
          type="date"
          value={sd}
          onChange={(e) => setSd(e.target.value)}
          onBlur={() => onSet('startedAt', combineDateTime(sd, st))}
        />
        <input
          className={inputClass}
          type="time"
          value={st}
          onChange={(e) => setSt(e.target.value)}
          onBlur={() => onSet('startedAt', combineDateTime(sd, st))}
        />
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={() => onSet('startedAt', new Date().toISOString())}
        >
          teraz
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm">
        <span className={`w-[86px] shrink-0 text-xs ${mutedTextClass}`}>Zakończono</span>
        <input
          className={inputClass}
          type="date"
          value={ed}
          onChange={(e) => setEd(e.target.value)}
          onBlur={() => onSet('finishedAt', combineDateTime(ed, et))}
        />
        <input
          className={inputClass}
          type="time"
          value={et}
          onChange={(e) => setEt(e.target.value)}
          onBlur={() => onSet('finishedAt', combineDateTime(ed, et))}
        />
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={() => onSet('finishedAt', new Date().toISOString())}
        >
          teraz
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className={primaryButtonClass} onClick={save} disabled={saving}>
          {saving ? '…' : 'Zapisz'}
        </button>
        <button type="button" className={secondaryButtonClass} onClick={() => setOpen(false)}>
          Zwiń
        </button>
      </div>
    </div>
  )
}

function SetForm({
  fields,
  initial,
  onSubmit,
  onCancel,
}: {
  fields: MetricField[]
  initial: Values
  onSubmit: (v: Values) => Promise<void>
  onCancel?: () => void
}) {
  const [values, setValues] = useState<Values>(initial)
  const [saving, setSaving] = useState(false)
  const set = (k: string, val: string) => setValues((p) => ({ ...p, [k]: val }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit(values)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="mt-1.5 flex flex-wrap gap-1.5" onSubmit={submit}>
      {fields.map((f, i) => {
        const meta = METRIC_FIELDS[f]
        if (meta.composite === 'duration') {
          return (
            <span className="inline-flex items-stretch gap-1" key={f}>
              <input
                className={compactUnitInputClass}
                type="number"
                min="0"
                placeholder="min"
                value={values[`${f}__min`] ?? ''}
                onChange={(e) => set(`${f}__min`, e.target.value)}
                autoFocus={i === 0}
              />
              <span className="flex items-center text-xs text-app-muted">min</span>
              <input
                className={compactUnitInputClass}
                type="number"
                min="0"
                max="59"
                placeholder="sek"
                value={values[`${f}__sec`] ?? ''}
                onChange={(e) => set(`${f}__sec`, e.target.value)}
              />
              <span className="flex items-center text-xs text-app-muted">sek</span>
            </span>
          )
        }
        if (meta.units) {
          const unit = values[`${f}__unit`] ?? meta.units.default
          return (
            <span className="inline-flex items-stretch gap-1" key={f}>
              <input
                className={compactUnitInputClass}
                type="number"
                step="any"
                placeholder={meta.placeholder}
                value={values[f] ?? ''}
                onChange={(e) => set(f, e.target.value)}
                autoFocus={i === 0}
              />
              <select
                className={selectClass}
                value={unit}
                onChange={(e) => set(`${f}__unit`, e.target.value)}
              >
                {meta.units.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </span>
          )
        }
        return (
          <input
            key={f}
            className={compactInputClass}
            type={meta.numeric ? 'number' : 'text'}
            step={meta.numeric ? '0.5' : undefined}
            placeholder={meta.placeholder}
            value={values[f] ?? ''}
            onChange={(e) => set(f, e.target.value)}
            autoFocus={i === 0}
          />
        )
      })}
      <input
        className={`min-w-[90px] flex-1 ${inputClass}`}
        type="text"
        placeholder="notatka"
        value={values.note ?? ''}
        onChange={(e) => set('note', e.target.value)}
      />
      <button className={primaryButtonClass} type="submit" disabled={saving}>
        {saving ? '…' : 'Zapisz'}
      </button>
      {onCancel && (
        <button className={secondaryButtonClass} type="button" onClick={onCancel}>
          Anuluj
        </button>
      )}
    </form>
  )
}

function SetItem({
  set,
  fields,
  onUpdate,
  onDelete,
}: {
  set: SetLog
  fields: MetricField[]
  onUpdate: (id: number, fields: MetricField[], v: Values) => Promise<void>
  onDelete: (id: number) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    const initial: Values = { note: set.note ?? '' }
    for (const f of fields) {
      const v = (set as Record<string, unknown>)[f]
      if (v == null) {
        initial[f] = ''
      } else if (METRIC_FIELDS[f].composite === 'duration') {
        const base = Number(v)
        initial[`${f}__min`] = String(Math.floor(base / 60))
        initial[`${f}__sec`] = String(base % 60)
      } else if (METRIC_FIELDS[f].units) {
        const conv = toDefaultUnit(f, Number(v))
        initial[f] = conv.value
        initial[`${f}__unit`] = conv.unit
      } else {
        initial[f] = String(v)
      }
    }
    return (
      <li className={`px-2.5 py-2 ${joinClasses(panelClass, 'rounded-lg bg-app-bg')}`}>
        <SetForm
          fields={fields}
          initial={initial}
          onSubmit={async (v) => {
            await onUpdate(set.id, fields, v)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    )
  }

  return (
    <li className="mb-1 flex items-center justify-between gap-2 rounded-lg border border-app-border bg-app-bg px-2.5 py-1.5 text-sm">
      <span>
        Seria {set.setNumber}: {setSummary(set)}
      </span>
      <span className="flex shrink-0 gap-0.5">
        <button className={iconButtonClass} onClick={() => setEditing(true)} aria-label="Edytuj">
          ✎
        </button>
        <button className={dangerIconButtonClass} onClick={() => onDelete(set.id)} aria-label="Usuń">
          ✕
        </button>
      </span>
    </li>
  )
}

function ExerciseRow({
  ex,
  sets,
  onAdd,
  onUpdate,
  onDelete,
}: {
  ex: TExercise
  sets: SetLog[]
  onAdd: (ex: TExercise, fields: MetricField[], v: Values) => Promise<void>
  onUpdate: (id: number, fields: MetricField[], v: Values) => Promise<void>
  onDelete: (id: number) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const fields = trackingFields(ex.trackingType)

  return (
    <div className="border-t border-app-border py-2 first:border-t-0">
      <div className="break-words text-sm text-app-text">
        {ex.numer ? (
          <span className={`inline-block min-w-[26px] font-semibold ${mutedTextClass}`}>{ex.numer}</span>
        ) : null}
        {ex.name}
        {ex.videoUrl && (
          <a
            className="ml-2 whitespace-nowrap text-xs text-app-accent"
            href={ex.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            ▶ wideo
          </a>
        )}
      </div>
      {ex.meta.length > 0 && <div className={`mt-0.5 pl-[26px] text-xs ${mutedTextClass}`}>{ex.meta.join(' · ')}</div>}
      {ex.note && <div className={`mt-0.5 pl-[26px] text-xs ${mutedTextClass}`}>{ex.note}</div>}

      {sets.length > 0 && (
        <ul className="mt-2 mb-1 list-none p-0">
          {sets.map((s) => (
            <SetItem key={s.id} set={s} fields={fields} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </ul>
      )}

      {open ? (
        <SetForm
          fields={fields}
          initial={{ reps: ex.prefill.reps ?? '', rir: ex.prefill.rir ?? '', note: '' }}
          onSubmit={async (v) => {
            await onAdd(ex, fields, v)
            setOpen(false)
          }}
          onCancel={() => setOpen(false)}
        />
      ) : (
        <button
          className={`mt-1.5 ${dashedButtonClass}`}
          onClick={() => setOpen(true)}
        >
          + dodaj serię
        </button>
      )}
    </div>
  )
}
