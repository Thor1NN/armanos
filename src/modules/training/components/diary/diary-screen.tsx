'use client'

import { useFormatter, useTranslations } from 'next-intl'
import React, { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Flame, Pencil, Plus, Trash2, X } from 'lucide-react'
import { sdk } from '@/lib/sdk'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { joinClasses } from '@/lib/class-names'
import type { DiaryEntry, Food } from '@/payload-types'

const KINDS = ['meal', 'activity', 'note'] as const
type Kind = (typeof KINDS)[number]

type DraftItem = {
  foodId: number | null
  name: string
  grams: number
  kcalPer100g: number
}

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

const itemKcal = (item: DraftItem): number => Math.round((item.grams * item.kcalPer100g) / 100)

const relId = (value: number | { id: number } | null | undefined): number | null =>
  value && typeof value === 'object' ? value.id : (value ?? null)

/** Client daily diary: meals with foods + grams (kcal computed), activities, notes. */
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

  // Meal builder state
  const [items, setItems] = useState<DraftItem[]>([])
  const [foodQuery, setFoodQuery] = useState('')
  const [foodResults, setFoodResults] = useState<Food[]>([])
  const [customOpen, setCustomOpen] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customKcal, setCustomKcal] = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const key = dayKey(day)
  const isToday = key === dayKey(new Date())
  const loading = loadedKey !== key

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

  // Debounced food search against the catalog.
  useEffect(() => {
    const query = foodQuery.trim()
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(
      () => {
        if (kind !== 'meal' || query.length < 2) {
          setFoodResults([])
          return
        }
        sdk
          .find({
            collection: 'foods',
            where: {
              and: [{ name: { like: query } }, { archived: { not_equals: true } }],
            },
            sort: 'name',
            limit: 8,
            depth: 0,
          })
          .then((result) => setFoodResults(result.docs))
          .catch(() => setFoodResults([]))
      },
      query.length < 2 ? 0 : 300,
    )
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [foodQuery, kind])

  const resetComposer = () => {
    setText('')
    setItems([])
    setFoodQuery('')
    setFoodResults([])
    setCustomOpen(false)
    setCustomName('')
    setCustomKcal('')
    setEditingId(null)
  }

  const addFood = (food: Food) => {
    setItems((prev) => [
      ...prev,
      { foodId: food.id, name: food.name, grams: 100, kcalPer100g: food.kcalPer100g },
    ])
    setFoodQuery('')
    setFoodResults([])
  }

  const addCustom = () => {
    const kcal = Number(customKcal)
    if (!customName.trim() || !Number.isFinite(kcal) || kcal < 0) return
    setItems((prev) => [
      ...prev,
      { foodId: null, name: customName.trim(), grams: 100, kcalPer100g: kcal },
    ])
    setCustomName('')
    setCustomKcal('')
    setCustomOpen(false)
  }

  const setGrams = (index: number, grams: number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, grams } : item)))
  }

  const draftTotal = items.reduce((sum, item) => sum + itemKcal(item), 0)
  const dayTotal = entries.reduce((sum, entry) => sum + (entry.totalKcal ?? 0), 0)
  const canSubmit = kind === 'meal' ? items.length > 0 || text.trim() : text.trim()

  const submit = async () => {
    if (!canSubmit || saving) return
    setSaving(true)
    setError(null)
    const payloadData = {
      kind,
      text: text.trim() || null,
      items:
        kind === 'meal'
          ? items.map((item) => ({
              food: item.foodId,
              name: item.name,
              grams: Math.round(item.grams) || 1,
              kcalPer100g: item.kcalPer100g,
            }))
          : [],
    }
    try {
      if (editingId) {
        const doc = await sdk.update({
          collection: 'diary-entries',
          id: editingId,
          depth: 0,
          data: payloadData,
        })
        setEntries((prev) => prev.map((entry) => (entry.id === doc.id ? doc : entry)))
      } else {
        const doc = await sdk.create({
          collection: 'diary-entries',
          depth: 0,
          data: { ...payloadData, entryDate: new Date(`${key}T12:00:00`).toISOString() },
        })
        setEntries((prev) => [...prev, doc])
      }
      resetComposer()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (entry: DiaryEntry) => {
    setEditingId(entry.id)
    setKind((entry.kind as Kind) ?? 'meal')
    setText(entry.text ?? '')
    setItems(
      (entry.items ?? []).map((item) => ({
        foodId: relId(item.food),
        name: item.name ?? '',
        grams: item.grams,
        kcalPer100g: item.kcalPer100g ?? 0,
      })),
    )
  }

  const remove = async (id: number) => {
    setError(null)
    try {
      await sdk.delete({ collection: 'diary-entries', id })
      setEntries((prev) => prev.filter((entry) => entry.id !== id))
      if (editingId === id) resetComposer()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t('deleteError'))
    }
  }

  return (
    <div className="space-y-3">
      {/* Day switcher + daily calories */}
      <div className="rounded-xl border border-ui-border-base bg-ui-bg-component px-2 py-1.5">
        <div className="flex items-center justify-between">
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
        {!loading && dayTotal > 0 && (
          <div className="flex items-center justify-center gap-1 border-t border-ui-border-base pt-1.5 pb-0.5 text-xs text-ui-fg-muted">
            <Flame size={12} className="text-ui-fg-interactive" />
            {t('dayTotal', { kcal: dayTotal })}
          </div>
        )}
      </div>

      {error && <Alert onDismiss={() => setError(null)}>{error}</Alert>}

      {/* Composer */}
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

        {kind === 'meal' && (
          <div className="mb-2 space-y-2">
            {/* Food search */}
            <div className="relative">
              <Input
                className="w-full"
                type="text"
                value={foodQuery}
                onChange={(event) => setFoodQuery(event.target.value)}
                placeholder={t('searchFood')}
              />
              {foodResults.length > 0 && (
                <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-component shadow-lg">
                  {foodResults.map((food) => (
                    <button
                      key={food.id}
                      type="button"
                      onClick={() => addFood(food)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-ui-bg-base"
                    >
                      <span>{food.name}</span>
                      <span className="text-xs text-ui-fg-muted">{food.kcalPer100g} kcal/100g</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom food */}
            {customOpen ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <Input
                  className="min-w-0 flex-1"
                  type="text"
                  value={customName}
                  onChange={(event) => setCustomName(event.target.value)}
                  placeholder={t('customName')}
                />
                <Input
                  className="w-24"
                  type="number"
                  min={0}
                  max={900}
                  inputMode="numeric"
                  value={customKcal}
                  onChange={(event) => setCustomKcal(event.target.value)}
                  placeholder={t('customKcal')}
                />
                <Button size="sm" type="button" onClick={addCustom} disabled={!customName.trim() || customKcal === ''}>
                  <Plus size={13} />
                </Button>
                <Button size="sm" variant="secondary" type="button" onClick={() => setCustomOpen(false)}>
                  <X size={13} />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="text-xs font-medium text-ui-fg-interactive"
                onClick={() => setCustomOpen(true)}
              >
                + {t('addCustomFood')}
              </button>
            )}

            {/* Draft items */}
            {items.length > 0 && (
              <ul className="flex list-none flex-col gap-1.5 p-0">
                {items.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 rounded-lg border border-ui-border-base bg-ui-bg-base px-2.5 py-1.5 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    <span className="flex items-center gap-1">
                      <Input
                        variant="compact"
                        className="w-16 text-right"
                        type="number"
                        min={1}
                        max={5000}
                        inputMode="numeric"
                        value={item.grams || ''}
                        onChange={(event) => setGrams(index, Number(event.target.value))}
                      />
                      <span className="text-xs text-ui-fg-muted">g</span>
                    </span>
                    <span className="w-16 shrink-0 text-right text-xs font-semibold tabular-nums">
                      {itemKcal(item)} kcal
                    </span>
                    <Button
                      variant="icon"
                      type="button"
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                      aria-label={t('removeItem')}
                    >
                      <X size={13} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {items.length > 0 && (
              <div className="text-right text-xs font-semibold text-ui-fg-base">
                {t('mealTotal', { kcal: draftTotal })}
              </div>
            )}
          </div>
        )}

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={kind === 'meal' ? t('placeholder_mealNote') : t(`placeholder_${kind}`)}
          rows={kind === 'meal' ? 1 : 2}
          maxLength={2000}
          className="w-full resize-none rounded-lg border border-ui-border-base bg-ui-bg-base px-3 py-2 text-sm text-ui-fg-base placeholder:text-ui-fg-muted focus:outline-none focus:ring-1 focus:ring-ui-fg-interactive"
        />
        <div className="mt-2 flex items-center gap-1.5">
          <Button className="flex-1 gap-1" onClick={submit} disabled={saving || !canSubmit}>
            {saving ? '…' : editingId ? t('saveEdit') : (
              <>
                <Plus size={14} />
                {t('add')}
              </>
            )}
          </Button>
          {editingId && (
            <Button variant="secondary" onClick={resetComposer}>
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
              className="rounded-xl border border-ui-border-base bg-ui-bg-component px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-ui-fg-interactive">
                    {t(`kind_${(entry.kind as Kind) ?? 'note'}`)}
                    {entry.totalKcal != null && entry.totalKcal > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-ui-fg-interactive/15 px-1.5 py-0.5 normal-case tracking-normal">
                        <Flame size={10} />
                        {entry.totalKcal} kcal
                      </span>
                    )}
                  </div>
                  {(entry.items ?? []).length > 0 && (
                    <ul className="mb-1 flex list-none flex-col gap-0.5 p-0 text-sm text-ui-fg-base">
                      {(entry.items ?? []).map((item, index) => (
                        <li key={index} className="flex justify-between gap-2">
                          <span className="min-w-0 truncate">
                            {item.grams} g {item.name}
                          </span>
                          <span className="shrink-0 text-xs text-ui-fg-muted tabular-nums">
                            {item.kcal} kcal
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {entry.text && (
                    <p className="whitespace-pre-wrap break-words text-sm text-ui-fg-muted">
                      {entry.text}
                    </p>
                  )}
                </div>
                <span className="flex shrink-0 gap-0.5">
                  <Button variant="icon" onClick={() => startEdit(entry)} aria-label={t('edit')}>
                    <Pencil size={14} />
                  </Button>
                  <Button variant="danger" onClick={() => remove(entry.id)} aria-label={t('delete')}>
                    <Trash2 size={14} />
                  </Button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
