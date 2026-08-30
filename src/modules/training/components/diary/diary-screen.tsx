'use client'

import { useFormatter, useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { sdk } from '@/lib/sdk'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { joinClasses } from '@/lib/class-names'
import type { DiaryEntry } from '@/payload-types'

const KINDS = ['meal', 'activity', 'note'] as const
type Kind = (typeof KINDS)[number]

const dayKey = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** Client daily diary: what I ate, what I did — quick entries per day. */
export function DiaryScreen() {
  const t = useTranslations('diary')
  const format = useFormatter()
  const [day, setDay] = useState(() => new Date())
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [kind, setKind] = useState<Kind>('meal')
  const [text, setText] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const key = dayKey(day)
  const isToday = key === dayKey(new Date())

  const loading = loadedKey !== dayKey(day)

  useEffect(() => {
    let active = true
    sdk
      .find({
        collection: 'diary-entries',
        where: {
          and: [
            { entryDate: { greater_than_equal: `${key}T00:00:00.000` } },
            { entryDate: { less_than: `${dayKey(addDays(day, 1))}T00:00:00.000` } },
          ],
        },
        sort: 'createdAt',
        limit: 100,
        depth: 0,
      })
      .then((result) => {
        if (!active) return
        setEntries(result.docs)
        setLoadedKey(key)
      })
      .catch((loadError) => {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : t('loadError'))
        setLoadedKey(key)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const submit = async () => {
    const trimmed = text.trim()
    if (!trimmed || saving) return
    setSaving(true)
    setError(null)
    try {
      if (editingId) {
        const doc = await sdk.update({
          collection: 'diary-entries',
          id: editingId,
          depth: 0,
          data: { kind, text: trimmed },
        })
        setEntries((prev) => prev.map((entry) => (entry.id === doc.id ? doc : entry)))
      } else {
        const doc = await sdk.create({
          collection: 'diary-entries',
          depth: 0,
          data: { kind, text: trimmed, entryDate: new Date(`${key}T12:00:00`).toISOString() },
        })
        setEntries((prev) => [...prev, doc])
      }
      setText('')
      setEditingId(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (entry: DiaryEntry) => {
    setEditingId(entry.id)
    setKind((entry.kind as Kind) ?? 'meal')
    setText(entry.text)
  }

  const remove = async (id: number) => {
    setError(null)
    try {
      await sdk.delete({ collection: 'diary-entries', id })
      setEntries((prev) => prev.filter((entry) => entry.id !== id))
      if (editingId === id) {
        setEditingId(null)
        setText('')
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t('deleteError'))
    }
  }

  return (
    <div className="space-y-3">
      {/* Day switcher */}
      <div className="flex items-center justify-between rounded-xl border border-ui-border-base bg-ui-bg-component px-2 py-1.5">
        <Button variant="icon" onClick={() => setDay((d) => addDays(d, -1))} aria-label={t('prevDay')}>
          <ChevronLeft size={18} />
        </Button>
        <span className="text-sm font-semibold">
          {isToday ? t('today') : format.dateTime(day, { weekday: 'short', day: 'numeric', month: 'long' })}
        </span>
        <Button
          variant="icon"
          onClick={() => setDay((d) => addDays(d, 1))}
          aria-label={t('nextDay')}
          disabled={isToday}
          className={isToday ? 'opacity-30' : undefined}
        >
          <ChevronRight size={18} />
        </Button>
      </div>

      {error && <Alert onDismiss={() => setError(null)}>{error}</Alert>}

      {/* Quick add / edit */}
      <div className="rounded-xl border border-ui-border-base bg-ui-bg-component p-3">
        <div className="mb-2 flex gap-1.5">
          {KINDS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setKind(option)}
              className={joinClasses(
                'flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors',
                kind === option
                  ? 'border-ui-fg-interactive bg-ui-fg-interactive/15 text-ui-fg-interactive'
                  : 'border-ui-border-base text-ui-fg-muted',
              )}
            >
              {t(`kind_${option}`)}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t(`placeholder_${kind}`)}
          rows={2}
          maxLength={2000}
          className="w-full resize-none rounded-lg border border-ui-border-base bg-ui-bg-base px-3 py-2 text-sm text-ui-fg-base placeholder:text-ui-fg-muted focus:outline-none focus:ring-1 focus:ring-ui-fg-interactive"
        />
        <div className="mt-2 flex items-center gap-1.5">
          <Button className="flex-1 gap-1" onClick={submit} disabled={saving || !text.trim()}>
            {saving ? '…' : editingId ? t('saveEdit') : (
              <>
                <Plus size={14} />
                {t('add')}
              </>
            )}
          </Button>
          {editingId && (
            <Button
              variant="secondary"
              onClick={() => {
                setEditingId(null)
                setText('')
              }}
            >
              {t('cancelEdit')}
            </Button>
          )}
        </div>
      </div>

      {/* Entries */}
      {loading ? (
        <div className="py-8 text-center text-sm text-ui-fg-muted">…</div>
      ) : entries.length === 0 ? (
        <div className="py-8 text-center text-sm text-ui-fg-muted">{t('empty')}</div>
      ) : (
        <ul className="flex list-none flex-col gap-2 p-0">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start justify-between gap-2 rounded-xl border border-ui-border-base bg-ui-bg-component px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-ui-fg-interactive">
                  {t(`kind_${(entry.kind as Kind) ?? 'note'}`)}
                </div>
                <p className="whitespace-pre-wrap break-words text-sm text-ui-fg-base">{entry.text}</p>
              </div>
              <span className="flex shrink-0 gap-0.5">
                <Button variant="icon" onClick={() => startEdit(entry)} aria-label={t('edit')}>
                  <Pencil size={14} />
                </Button>
                <Button variant="danger" onClick={() => remove(entry.id)} aria-label={t('delete')}>
                  <Trash2 size={14} />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
