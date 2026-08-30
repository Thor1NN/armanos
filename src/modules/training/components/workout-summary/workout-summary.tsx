'use client'

import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'
import { Clock, Dumbbell, Layers, Trophy, X } from 'lucide-react'
import { sdk } from '@/lib/sdk'
import { statLabelClass } from '@/lib/class-names'
import { Button } from '@/components/ui/button'
import { CountUp } from '@/components/ui/stat-ring'
import {
  detectPrs,
  isWorkingSet,
  sessionVolume,
  type PrKind,
} from '@/modules/training/logs'
import type { SetLog, WorkoutLog } from '@/payload-types'

type ExercisePr = { exerciseName: string; kind: PrKind; value: number; previous: number }

/**
 * Post-finish celebration card: duration, total volume, set count, and the
 * personal records this session broke (compared against all prior history).
 */
export function WorkoutSummary({
  session,
  sets,
  onClose,
}: {
  session: WorkoutLog
  sets: SetLog[]
  onClose: () => void
}) {
  const t = useTranslations('summary')
  const [prs, setPrs] = useState<ExercisePr[] | null>(null)

  const workingSets = sets.filter(isWorkingSet)
  const volume = sessionVolume(sets)
  // completedAt is set by the finish endpoint before this renders; the state
  // initializer keeps the fallback clock read out of render.
  const [now] = useState(() => Date.now())
  const started = session.startedAt ? new Date(session.startedAt).getTime() : null
  const finished = session.completedAt ? new Date(session.completedAt).getTime() : now
  const durationMin = started ? Math.max(1, Math.round((finished - started) / 60000)) : null

  // Compare this session's best sets against all prior history per exercise.
  useEffect(() => {
    let active = true
    const names = [...new Set(sets.map((set) => set.exerciseName?.trim()).filter(Boolean))] as string[]
    if (!names.length) {
      const raf = requestAnimationFrame(() => setPrs([]))
      return () => cancelAnimationFrame(raf)
    }
    sdk
      .find({
        collection: 'set-logs',
        where: {
          and: [
            { exerciseName: { in: names } },
            { session: { not_equals: session.id } },
          ],
        },
        limit: 2000,
        depth: 0,
      })
      .then((history) => {
        if (!active) return
        const found: ExercisePr[] = []
        for (const name of names) {
          const sessionSets = sets.filter((set) => set.exerciseName?.trim() === name)
          const historySets = history.docs.filter((set) => set.exerciseName?.trim() === name)
          for (const pr of detectPrs(sessionSets, historySets)) {
            found.push({ exerciseName: name, ...pr })
          }
        }
        setPrs(found)
      })
      .catch(() => {
        if (active) setPrs([])
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id])

  return (
    <div className="fx-card fx-in relative overflow-hidden p-5">
      {/* Celebration glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-48"
        style={{
          background:
            'radial-gradient(60% 100% at 50% 0%, color-mix(in srgb, var(--color-stat-green) 22%, transparent), transparent 75%)',
        }}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label={t('close')}
        className="absolute right-3 top-3 rounded-full p-1.5 text-ui-fg-muted transition-colors hover:text-ui-fg-base"
      >
        <X size={16} />
      </button>

      <div className={statLabelClass} style={{ color: 'var(--color-stat-green)' }}>
        {t('label')}
      </div>
      <h2 className="font-display mt-1 text-4xl font-bold uppercase leading-none tracking-wide text-ui-fg-base">
        {t('title')}
      </h2>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <div>
          <Clock size={15} className="mx-auto mb-1 text-ui-fg-muted" />
          <div className="font-display text-3xl font-bold tabular-nums leading-none">
            {durationMin != null ? <CountUp value={durationMin} /> : '—'}
          </div>
          <div className={`mt-1 ${statLabelClass}`}>{t('minutes')}</div>
        </div>
        <div>
          <Dumbbell size={15} className="mx-auto mb-1 text-ui-fg-muted" />
          <div className="font-display text-3xl font-bold tabular-nums leading-none">
            <CountUp value={volume} />
          </div>
          <div className={`mt-1 ${statLabelClass}`}>{t('volumeKg')}</div>
        </div>
        <div>
          <Layers size={15} className="mx-auto mb-1 text-ui-fg-muted" />
          <div className="font-display text-3xl font-bold tabular-nums leading-none">
            <CountUp value={workingSets.length} />
          </div>
          <div className={`mt-1 ${statLabelClass}`}>{t('sets')}</div>
        </div>
      </div>

      {/* Personal records */}
      <div className="mt-5">
        {prs === null ? (
          <div className="py-2 text-center text-xs text-ui-fg-muted">…</div>
        ) : prs.length === 0 ? (
          <div className="rounded-xl bg-ui-bg-subtle px-3 py-2.5 text-center text-xs text-ui-fg-muted">
            {t('noPrs')}
          </div>
        ) : (
          <ul className="flex list-none flex-col gap-1.5 p-0">
            {prs.map((pr, index) => (
              <li
                key={index}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
                style={{
                  background: 'color-mix(in srgb, var(--color-stat-amber) 10%, transparent)',
                }}
              >
                <Trophy size={15} className="shrink-0" style={{ color: 'var(--color-stat-amber)' }} />
                <span className="min-w-0 flex-1 truncate font-semibold">{pr.exerciseName}</span>
                <span className="shrink-0 text-xs text-ui-fg-muted">
                  {t(`pr_${pr.kind}`)}{' '}
                  <strong className="text-ui-fg-base tabular-nums">
                    {pr.kind === 'volume' ? `${Math.round(pr.value)} kg` : `${pr.value} kg`}
                  </strong>
                  {pr.previous > 0 && <> · {t('prev')} {Math.round(pr.previous * 10) / 10}</>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button className="fx-btn-glow font-display mt-5 w-full gap-2 py-2.5 text-base font-semibold uppercase tracking-[0.14em]" onClick={onClose}>
        {t('done')}
      </Button>
    </div>
  )
}
