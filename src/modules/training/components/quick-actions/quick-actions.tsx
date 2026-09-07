'use client'

import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import { Footprints, Scale, StickyNote, Utensils } from 'lucide-react'
import { sdk } from '@/lib/sdk'
import { Alert } from '@/components/ui/alert'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDailyData } from '@/modules/training/components/daily'
import { EntryComposer, type EntryKind } from '@/modules/training/components/diary/entry-composer'

export type QuickAction = EntryKind | 'weight'

const ACTIONS: { id: QuickAction; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'meal', icon: Utensils },
  { id: 'activity', icon: Footprints },
  { id: 'note', icon: StickyNote },
  { id: 'weight', icon: Scale },
]

/** Four one-tap entry points; each opens a focused bottom sheet. */
export function QuickActions({
  open,
  onOpenChange,
}: {
  open: QuickAction | null
  onOpenChange: (action: QuickAction | null) => void
}) {
  const t = useTranslations('quickActions')
  const { key, refresh } = useDailyData()

  return (
    <>
      <div className="grid grid-cols-4 gap-2" role="group" aria-label={t('label')}>
        {ACTIONS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onOpenChange(id)}
            className="fx-card flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-2xl px-1 py-2 text-xs font-semibold text-ui-fg-base transition-transform active:scale-[0.97]"
          >
            <Icon size={20} />
            {t(id)}
          </button>
        ))}
      </div>

      <BottomSheet
        open={open !== null && open !== 'weight'}
        title={open && open !== 'weight' ? t(`title_${open}`) : undefined}
        onClose={() => onOpenChange(null)}
        closeLabel={t('close')}
      >
        {open && open !== 'weight' && (
          <EntryComposer
            dayKey={key}
            initialKind={open}
            lockKind
            onSaved={() => {
              onOpenChange(null)
              refresh()
            }}
          />
        )}
      </BottomSheet>

      <BottomSheet open={open === 'weight'} title={t('title_weight')} onClose={() => onOpenChange(null)} closeLabel={t('close')}>
        {open === 'weight' && (
          <WeightForm
            dayKey={key}
            onSaved={() => {
              onOpenChange(null)
              refresh()
            }}
          />
        )}
      </BottomSheet>
    </>
  )
}

function WeightForm({ dayKey, onSaved }: { dayKey: string; onSaved: () => void }) {
  const t = useTranslations('quickActions')
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedWeight = Number(weight.replace(',', '.'))
  const valid = Number.isFinite(parsedWeight) && parsedWeight >= 20 && parsedWeight <= 400

  const submit = async () => {
    if (!valid || saving) return
    setSaving(true)
    setError(null)
    try {
      await sdk.create({
        collection: 'body-measurements',
        depth: 0,
        data: {
          measuredAt: new Date(`${dayKey}T12:00:00`).toISOString(),
          weightKg: Math.round(parsedWeight * 4) / 4,
          waistCm: waist ? Number(waist.replace(',', '.')) : undefined,
        },
      })
      onSaved()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && <Alert onDismiss={() => setError(null)}>{error}</Alert>}
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-semibold text-ui-fg-muted">{t('weightKg')}</span>
        <Input
          className="w-full text-lg"
          type="number"
          inputMode="decimal"
          min={20}
          max={400}
          step="0.25"
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
          autoFocus
        />
        <span className="mt-1 block text-xs text-ui-fg-muted">{t('weightHint')}</span>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-semibold text-ui-fg-muted">{t('waistCm')}</span>
        <Input
          className="w-full"
          type="number"
          inputMode="decimal"
          min={30}
          max={300}
          value={waist}
          onChange={(event) => setWaist(event.target.value)}
        />
      </label>
      <Button className="min-h-11 w-full text-base" onClick={submit} disabled={!valid || saving}>
        {saving ? t('saving') : t('save')}
      </Button>
    </div>
  )
}
