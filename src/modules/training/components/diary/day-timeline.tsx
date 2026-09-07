'use client'

import { useFormatter, useTranslations } from 'next-intl'
import React, { useState } from 'react'
import { CheckCircle2, Flame, Footprints, Pencil, Scale, StickyNote, Trash2, Utensils } from 'lucide-react'
import { sdk } from '@/lib/sdk'
import { Alert } from '@/components/ui/alert'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { useDailyData } from '@/modules/training/components/daily'
import type { DiaryEntry } from '@/payload-types'
import { EntryComposer, type EntryKind } from './entry-composer'

const KIND_ICON: Record<EntryKind, React.ComponentType<{ size?: number; className?: string }>> = {
  meal: Utensils,
  activity: Footprints,
  note: StickyNote,
}

/**
 * Everything recorded on the selected day, in one list: meals (with kcal),
 * activities, notes, body weight and completed workouts. Entries can be
 * edited in a sheet or deleted; every change refreshes the shared day data.
 */
export function DayTimeline() {
  const t = useTranslations('diary')
  const format = useFormatter()
  const { key, data, loading, error, refresh } = useDailyData()
  const [editing, setEditing] = useState<DiaryEntry | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const remove = async (entry: DiaryEntry) => {
    if (!window.confirm(t('confirmDelete'))) return
    setActionError(null)
    try {
      await sdk.delete({ collection: 'diary-entries', id: entry.id })
      refresh()
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : t('deleteError'))
    }
  }

  if (loading || !data) {
    return <div className="py-6 text-center text-sm text-ui-fg-muted" aria-busy="true">{t('loading')}</div>
  }
  if (error) {
    return <Alert>{error}</Alert>
  }

  const { entries, measurements, completedSessions } = data
  const isEmpty = entries.length === 0 && measurements.length === 0 && completedSessions.length === 0

  return (
    <div className="space-y-2">
      {actionError && <Alert onDismiss={() => setActionError(null)}>{actionError}</Alert>}

      {isEmpty && (
        <div className="rounded-2xl border border-dashed border-ui-border-base px-4 py-6 text-center text-sm text-ui-fg-muted">
          {t('emptyDay')}
        </div>
      )}

      {completedSessions.map((session) => (
        <div key={`s-${session.id}`} className="flex items-center gap-3 rounded-2xl bg-ui-bg-subtle px-3 py-2.5 text-sm">
          <CheckCircle2 size={18} className="shrink-0" style={{ color: 'var(--color-stat-green)' }} aria-hidden />
          <span className="min-w-0 flex-1 truncate font-medium">{session.title || t('sessionFallback')}</span>
          {session.completedAt && (
            <span className="shrink-0 text-xs text-ui-fg-muted tabular-nums">
              {format.dateTime(new Date(session.completedAt), { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      ))}

      {measurements.map((measurement) => (
        <div key={`m-${measurement.id}`} className="flex items-center gap-3 rounded-2xl bg-ui-bg-subtle px-3 py-2.5 text-sm">
          <Scale size={18} className="shrink-0 text-ui-fg-muted" aria-hidden />
          <span className="min-w-0 flex-1">
            {measurement.weightKg != null && <span className="font-medium tabular-nums">{measurement.weightKg} kg</span>}
            {measurement.waistCm != null && <span className="text-ui-fg-muted"> · {t('waist')} {measurement.waistCm} cm</span>}
          </span>
        </div>
      ))}

      <ul className="flex list-none flex-col gap-2 p-0">
        {entries.map((entry) => {
          const kind = (entry.kind as EntryKind) ?? 'note'
          const Icon = KIND_ICON[kind]
          return (
            <li key={entry.id} className="rounded-2xl border border-ui-border-base bg-ui-bg-component px-3 py-2.5">
              <div className="flex items-start gap-3">
                <Icon size={18} className="mt-0.5 shrink-0 text-ui-fg-muted" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-ui-fg-muted">
                    <span>{t(`kind_${kind}`)}</span>
                    {entry.totalKcal != null && entry.totalKcal > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ui-bg-subtle px-2 py-0.5 tabular-nums text-ui-fg-base">
                        <Flame size={11} style={{ color: 'var(--color-stat-green)' }} aria-hidden />
                        {entry.totalKcal} kcal
                      </span>
                    )}
                  </div>
                  {(entry.items ?? []).length > 0 && (
                    <ul className="mt-1 flex list-none flex-col gap-0.5 p-0 text-sm">
                      {(entry.items ?? []).map((item, index) => (
                        <li key={index} className="flex justify-between gap-2">
                          <span className="min-w-0 truncate">{item.grams} g {item.name}</span>
                          <span className="shrink-0 text-xs text-ui-fg-muted tabular-nums">{item.kcal} kcal</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {entry.text && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ui-fg-base">{entry.text}</p>}
                </div>
                <span className="flex shrink-0 gap-0.5">
                  <Button variant="icon" className="min-h-9 min-w-9" onClick={() => setEditing(entry)} aria-label={t('edit')}>
                    <Pencil size={15} />
                  </Button>
                  <Button variant="danger" className="min-h-9 min-w-9" onClick={() => remove(entry)} aria-label={t('delete')}>
                    <Trash2 size={15} />
                  </Button>
                </span>
              </div>
            </li>
          )
        })}
      </ul>

      <BottomSheet open={editing !== null} title={t('editTitle')} onClose={() => setEditing(null)} closeLabel={t('cancelEdit')}>
        {editing && (
          <EntryComposer
            dayKey={key}
            editing={editing}
            lockKind
            onSaved={() => {
              setEditing(null)
              refresh()
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </BottomSheet>
    </div>
  )
}
