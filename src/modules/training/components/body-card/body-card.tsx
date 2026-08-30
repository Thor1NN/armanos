'use client'

import { useFormatter, useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'
import { Plus, Scale, Trash2 } from 'lucide-react'
import { sdk } from '@/lib/sdk'
import { statLabelClass } from '@/lib/class-names'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CountUp } from '@/components/ui/stat-ring'
import type { BodyMeasurement } from '@/payload-types'

const SPARK_WIDTH = 280
const SPARK_HEIGHT = 56

/** Bodyweight + measurements: latest weight, sparkline, quick add. */
export function BodyCard() {
  const t = useTranslations('body')
  const format = useFormatter()
  const [entries, setEntries] = useState<BodyMeasurement[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [moreOpen, setMoreOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    sdk
      .find({
        collection: 'body-measurements',
        sort: 'measuredAt',
        limit: 60,
        depth: 0,
      })
      .then((result) => {
        if (!active) return
        setEntries(result.docs)
        setLoaded(true)
      })
      .catch(() => {
        if (active) setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [])

  const weights = entries.filter((entry) => entry.weightKg != null)
  const latest = weights[weights.length - 1]
  const previous = weights[weights.length - 2]
  const delta =
    latest?.weightKg != null && previous?.weightKg != null
      ? Math.round((latest.weightKg - previous.weightKg) * 10) / 10
      : null

  const spark = (() => {
    if (weights.length < 2) return null
    const values = weights.map((entry) => entry.weightKg as number)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = Math.max(max - min, 0.5)
    const stepX = SPARK_WIDTH / (values.length - 1)
    return values
      .map(
        (value, index) =>
          `${index * stepX},${SPARK_HEIGHT - ((value - min) / span) * (SPARK_HEIGHT - 8) - 4}`,
      )
      .join(' ')
  })()

  const submit = async () => {
    const weightNum = Number(weight.replace(',', '.'))
    if (!Number.isFinite(weightNum) || weightNum <= 0 || saving) return
    setSaving(true)
    setError(null)
    try {
      const doc = await sdk.create({
        collection: 'body-measurements',
        depth: 0,
        data: {
          measuredAt: new Date().toISOString(),
          weightKg: Math.round(weightNum * 4) / 4,
          waistCm: waist ? Number(waist.replace(',', '.')) : undefined,
        },
      })
      setEntries((prev) => [...prev, doc])
      setWeight('')
      setWaist('')
      setMoreOpen(false)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  const removeLatest = async () => {
    if (!latest) return
    try {
      await sdk.delete({ collection: 'body-measurements', id: latest.id })
      setEntries((prev) => prev.filter((entry) => entry.id !== latest.id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t('saveError'))
    }
  }

  return (
    <section className="fx-card fx-in p-4" style={{ animationDelay: '300ms' }}>
      <div className={`mb-3 flex items-center justify-between ${statLabelClass}`}>
        <span>{t('label')}</span>
        {latest?.measuredAt && (
          <span>{format.dateTime(new Date(latest.measuredAt), { day: 'numeric', month: 'short' })}</span>
        )}
      </div>

      {error && <Alert className="mb-2" onDismiss={() => setError(null)}>{error}</Alert>}

      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <div className="flex items-baseline gap-1">
            <Scale size={16} className="text-ui-fg-muted" />
            <span className="font-display text-4xl font-bold tabular-nums leading-none text-ui-fg-base">
              {latest?.weightKg != null ? <CountUp value={Math.round(latest.weightKg)} /> : '—'}
            </span>
            <span className={statLabelClass}>kg</span>
          </div>
          {delta !== null && (
            <div
              className="mt-1 text-xs font-semibold tabular-nums"
              style={{ color: delta <= 0 ? 'var(--color-stat-green)' : 'var(--color-stat-amber)' }}
            >
              {delta > 0 ? '+' : ''}
              {delta} kg
            </div>
          )}
        </div>
        {spark && (
          <svg viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`} className="h-14 min-w-0 flex-1">
            <polyline
              fill="none"
              strokeWidth={2.5}
              stroke="var(--color-stat-blue)"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={spark}
              style={{
                filter:
                  'drop-shadow(0 0 5px color-mix(in srgb, var(--color-stat-blue) 50%, transparent))',
              }}
            />
          </svg>
        )}
      </div>

      {loaded && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Input
            variant="compact"
            className="w-24"
            type="number"
            min={20}
            max={400}
            step="0.25"
            inputMode="decimal"
            placeholder={t('weightPlaceholder')}
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
          />
          {moreOpen && (
            <Input
              variant="compact"
              className="w-24"
              type="number"
              min={30}
              max={300}
              inputMode="decimal"
              placeholder={t('waistPlaceholder')}
              value={waist}
              onChange={(event) => setWaist(event.target.value)}
            />
          )}
          <Button size="sm" onClick={submit} disabled={saving || !weight}>
            <Plus size={13} />
            {t('add')}
          </Button>
          {!moreOpen && (
            <button
              type="button"
              className="text-xs font-medium text-ui-fg-interactive"
              onClick={() => setMoreOpen(true)}
            >
              + {t('more')}
            </button>
          )}
          {latest && (
            <Button variant="icon" onClick={removeLatest} aria-label={t('deleteLatest')}>
              <Trash2 size={13} />
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
