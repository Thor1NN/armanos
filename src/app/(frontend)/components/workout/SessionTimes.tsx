'use client'

import React, { useState } from 'react'
import {
  inputClass,
  joinClasses,
  mutedTextClass,
  panelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../ui'
import type { Session } from './types'
import { combineDateTime, fmtDuration, isoToDateInput, isoToTimeInput } from './utils'

export function SessionTimes({
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
