'use client'

import { useTranslations } from 'next-intl'
import React, { useEffect, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { sdk } from '@/lib/sdk'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { joinClasses } from '@/lib/class-names'
import type { DiaryEntry, Food } from '@/payload-types'

export const ENTRY_KINDS = ['meal', 'activity', 'note'] as const
export type EntryKind = (typeof ENTRY_KINDS)[number]

type DraftItem = {
  foodId: number | null
  name: string
  grams: number
  kcalPer100g: number
}

const itemKcal = (item: DraftItem): number => Math.round((item.grams * item.kcalPer100g) / 100)

const relId = (value: number | { id: number } | null | undefined): number | null =>
  value && typeof value === 'object' ? value.id : (value ?? null)

/**
 * Create/edit form for one diary entry. Meals are built from catalog foods or
 * custom foods with grams; the shown kcal is a preview, the server total is
 * authoritative. `dayKey` fixes the entry date for new entries.
 */
export function EntryComposer({
  dayKey,
  initialKind = 'meal',
  lockKind = false,
  editing,
  onSaved,
  onCancel,
}: {
  dayKey: string
  initialKind?: EntryKind
  lockKind?: boolean
  editing?: DiaryEntry | null
  onSaved: (entry: DiaryEntry) => void
  onCancel?: () => void
}) {
  const t = useTranslations('diary')
  const [kind, setKind] = useState<EntryKind>((editing?.kind as EntryKind) ?? initialKind)
  const [text, setText] = useState(editing?.text ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [items, setItems] = useState<DraftItem[]>(() =>
    (editing?.items ?? []).map((item) => ({
      foodId: relId(item.food),
      name: item.name ?? '',
      grams: item.grams,
      kcalPer100g: item.kcalPer100g ?? 0,
    })),
  )
  const [foodQuery, setFoodQuery] = useState('')
  const [foodResults, setFoodResults] = useState<Food[]>([])
  const [customOpen, setCustomOpen] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customKcal, setCustomKcal] = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced catalog search.
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
            where: { and: [{ name: { like: query } }, { archived: { not_equals: true } }] },
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

  const addFood = (food: Food) => {
    setItems((prev) => [...prev, { foodId: food.id, name: food.name, grams: 100, kcalPer100g: food.kcalPer100g }])
    setFoodQuery('')
    setFoodResults([])
  }

  const addCustom = () => {
    const kcal = Number(customKcal.replace(',', '.'))
    if (!customName.trim() || !Number.isFinite(kcal) || kcal < 0) return
    setItems((prev) => [...prev, { foodId: null, name: customName.trim(), grams: 100, kcalPer100g: kcal }])
    setCustomName('')
    setCustomKcal('')
    setCustomOpen(false)
  }

  const draftTotal = items.reduce((sum, item) => sum + itemKcal(item), 0)
  const canSubmit = kind === 'meal' ? items.length > 0 || text.trim() !== '' : text.trim() !== ''

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
              grams: Math.max(1, Math.round(item.grams)),
              kcalPer100g: item.kcalPer100g,
            }))
          : [],
    }
    try {
      const doc = editing
        ? await sdk.update({ collection: 'diary-entries', id: editing.id, depth: 0, data: payloadData })
        : await sdk.create({
            collection: 'diary-entries',
            depth: 0,
            data: { ...payloadData, entryDate: new Date(`${dayKey}T12:00:00`).toISOString() },
          })
      onSaved(doc)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {!lockKind && (
        <div className="flex gap-1.5" role="tablist" aria-label={t('kindLabel')}>
          {ENTRY_KINDS.map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={kind === option}
              onClick={() => setKind(option)}
              className={joinClasses(
                'min-h-10 flex-1 rounded-xl border px-2 text-sm font-semibold transition-colors',
                kind === option
                  ? 'border-ui-border-interactive bg-ui-bg-interactive/10 text-ui-fg-interactive'
                  : 'border-ui-border-base text-ui-fg-muted',
              )}
            >
              {t(`kind_${option}`)}
            </button>
          ))}
        </div>
      )}

      {error && <Alert onDismiss={() => setError(null)}>{error}</Alert>}

      {kind === 'meal' && (
        <div className="space-y-2">
          <div className="relative">
            <Input
              className="w-full"
              type="search"
              value={foodQuery}
              onChange={(event) => setFoodQuery(event.target.value)}
              placeholder={t('searchFood')}
              aria-label={t('searchFood')}
              autoComplete="off"
            />
            {foodResults.length > 0 && (
              <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-ui-border-base bg-ui-bg-component p-0 shadow-lg" role="listbox">
                {foodResults.map((food) => (
                  <li key={food.id} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onClick={() => addFood(food)}
                      className="flex min-h-11 w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-ui-bg-subtle"
                    >
                      <span>{food.name}</span>
                      <span className="text-xs text-ui-fg-muted tabular-nums">{food.kcalPer100g} kcal/100 g</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {customOpen ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <Input
                className="min-w-0 flex-1"
                type="text"
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder={t('customName')}
                aria-label={t('customName')}
              />
              <Input
                className="w-24"
                type="number"
                min={0}
                max={900}
                inputMode="decimal"
                value={customKcal}
                onChange={(event) => setCustomKcal(event.target.value)}
                placeholder={t('customKcal')}
                aria-label={t('customKcal')}
              />
              <Button size="sm" onClick={addCustom} disabled={!customName.trim() || customKcal === ''} aria-label={t('addCustomFood')}>
                <Plus size={14} />
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setCustomOpen(false)} aria-label={t('cancelEdit')}>
                <X size={14} />
              </Button>
            </div>
          ) : (
            <button type="button" className="min-h-9 text-sm font-medium text-ui-fg-interactive" onClick={() => setCustomOpen(true)}>
              + {t('addCustomFood')}
            </button>
          )}

          {items.length > 0 && (
            <ul className="flex list-none flex-col gap-1.5 p-0">
              {items.map((item, index) => (
                <li key={index} className="flex items-center gap-2 rounded-xl border border-ui-border-base bg-ui-bg-base px-2.5 py-1.5 text-sm">
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
                      onChange={(event) =>
                        setItems((prev) => prev.map((row, i) => (i === index ? { ...row, grams: Number(event.target.value) } : row)))
                      }
                      aria-label={`${item.name} grams`}
                    />
                    <span className="text-xs text-ui-fg-muted">g</span>
                  </span>
                  <span className="w-16 shrink-0 text-right text-xs font-semibold tabular-nums">{itemKcal(item)} kcal</span>
                  <Button variant="icon" onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))} aria-label={t('removeItem')}>
                    <X size={14} />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {items.length > 0 && (
            <div className="text-right text-xs text-ui-fg-muted">
              {t('mealTotal', { kcal: draftTotal })} · {t('estimateNote')}
            </div>
          )}
        </div>
      )}

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={kind === 'meal' ? t('placeholder_mealNote') : t(`placeholder_${kind}`)}
        rows={kind === 'meal' ? 1 : 3}
        maxLength={2000}
        aria-label={t(`kind_${kind}`)}
        className="w-full resize-none rounded-xl border border-ui-border-base bg-ui-bg-base px-3 py-2.5 text-base text-ui-fg-base placeholder:text-ui-fg-muted focus:outline-none focus:ring-2 focus:ring-ui-border-interactive/30"
      />

      <div className="flex items-center gap-2">
        <Button className="min-h-11 flex-1 gap-1.5 text-base" onClick={submit} disabled={saving || !canSubmit}>
          {saving ? t('saving') : editing ? t('saveEdit') : t('add')}
        </Button>
        {onCancel && (
          <Button variant="secondary" className="min-h-11" onClick={onCancel}>
            {t('cancelEdit')}
          </Button>
        )}
      </div>
    </div>
  )
}
