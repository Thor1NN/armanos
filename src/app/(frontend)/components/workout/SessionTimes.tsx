'use client'

import React, { useState } from 'react'
import { joinClasses, mutedTextClass } from '../../ui'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Surface } from '../ui/Surface'
import type { Session } from './types'
import { combineDateTime, fmtDuration, isoToDateInput, isoToTimeInput } from './utils'

export function SessionTimesBadge({
  session,
  open,
  onOpen,
}: {
  session: Session | null
  open: boolean
  onOpen: () => void
}) {
  const startIso = session?.startedAt ?? null
  const finishIso = session?.finishedAt ?? null
  const duration = fmtDuration(startIso, finishIso)
  const compact = (iso: string | null) =>
    iso ? `${isoToDateInput(iso).slice(5).replace('-', '.')} ${isoToTimeInput(iso)}` : null
  const s = compact(startIso)
  const e = compact(finishIso)

  return (
    <Button
      variant="secondary"
      className={joinClasses(
        'rounded-full bg-app-panel px-3 py-1.5 text-xs font-normal text-app-text',
        open && 'border-app-accent text-app-text',
      )}
      onClick={onOpen}
    >
      {s || e ? (
        <span className="flex items-center gap-2">
          <span>
            {s ?? '—'}
            {e ? ` – ${e}` : ''}
          </span>
          {duration && <span className="font-semibold text-app-accent">{duration}</span>}
        </span>
      ) : (
        <span className={mutedTextClass}>Ustaw czas treningu</span>
      )}
    </Button>
  )
}

export function SessionTimesForm({
  session,
  onSet,
  onSave,
  onClose,
}: {
  session: Session | null
  onSet: (field: 'startedAt' | 'finishedAt', iso: string | null) => void
  onSave: (startedAt: string | null, finishedAt: string | null) => Promise<void>
  onClose: () => void
}) {
  const startIso = session?.startedAt ?? null
  const finishIso = session?.finishedAt ?? null

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

  const setStartNow = () => {
    const iso = new Date().toISOString()
    setSd(isoToDateInput(iso))
    setSt(isoToTimeInput(iso))
    onSet('startedAt', iso)
  }

  const addToStart = (hours: number) => {
    const base = combineDateTime(sd, st) ?? new Date().toISOString()
    const iso = new Date(new Date(base).getTime() + hours * 3600 * 1000).toISOString()
    setEd(sd || isoToDateInput(iso))
    setEt(isoToTimeInput(iso))
    onSet('finishedAt', combineDateTime(sd || isoToDateInput(iso), isoToTimeInput(iso)))
  }

  const save = async () => {
    setSaving(true)
    try {
      await onSave(combineDateTime(sd, st), combineDateTime(ed || sd, et))
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Surface className="mt-2 p-3 font-normal" variant="panel">
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className={`w-20 shrink-0 text-xs ${mutedTextClass}`}>Rozpoczęto</span>
          <Input
            type="date"
            value={sd}
            onChange={(e) => setSd(e.target.value)}
            onBlur={() => onSet('startedAt', combineDateTime(sd, st))}
          />
          <Input
            type="time"
            value={st}
            onChange={(e) => setSt(e.target.value)}
            onBlur={() => onSet('startedAt', combineDateTime(sd, st))}
          />
          <Button variant="secondary" onClick={setStartNow}>
            teraz
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className={`w-20 shrink-0 text-xs ${mutedTextClass}`}>Zakończono</span>
          <Input
            type="time"
            value={et}
            onChange={(e) => setEt(e.target.value)}
            onBlur={() => onSet('finishedAt', combineDateTime(ed || sd, et))}
          />
          {([1, 1.5, 2] as const).map((h) => (
            <Button key={h} variant="secondary" onClick={() => addToStart(h)}>
              +{h}h
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Button className="min-h-8 px-3 py-1 text-xs" onClick={save} disabled={saving}>
            {saving ? '…' : 'Zapisz'}
          </Button>
          <Button className="min-h-8 px-3 py-1 text-xs" variant="secondary" onClick={onClose}>
            Zwiń
          </Button>
        </div>
      </div>
    </Surface>
  )
}
