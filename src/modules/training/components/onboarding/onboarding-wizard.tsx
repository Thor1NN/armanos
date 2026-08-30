'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { sdk } from '@/lib/sdk'
import { statLabelClass } from '@/lib/class-names'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const STEPS = ['gender', 'birthday', 'height', 'weight', 'goal', 'experience'] as const
type Step = (typeof STEPS)[number]

const GENDERS = ['male', 'female', 'other'] as const
const GOALS = ['build_muscle', 'gain_strength', 'fat_loss'] as const
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const

function OptionCard({
  selected,
  onClick,
  title,
  subtitle,
}: {
  selected: boolean
  onClick: () => void
  title: string
  subtitle?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fx-card flex w-full items-center justify-between px-4 py-4 text-left transition-transform active:scale-[0.99]"
      style={
        selected
          ? {
              borderColor: 'var(--color-stat-blue)',
              boxShadow:
                '0 0 0 1px var(--color-stat-blue), 0 8px 24px -12px color-mix(in srgb, var(--color-stat-blue) 45%, transparent)',
            }
          : undefined
      }
    >
      <span>
        <span className="block text-base font-semibold text-ui-fg-base">{title}</span>
        {subtitle && <span className="mt-0.5 block text-xs text-ui-fg-muted">{subtitle}</span>}
      </span>
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full border-2"
        style={{
          borderColor: selected ? 'var(--color-stat-blue)' : 'var(--color-ui-border-strong)',
        }}
      >
        {selected && (
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--color-stat-blue)' }} />
        )}
      </span>
    </button>
  )
}

/**
 * Hevy-style first-login onboarding: one question per screen. Answers land on
 * the client profile; the weight answer becomes the first body measurement.
 */
export function OnboardingWizard({ clientId }: { clientId: number }) {
  const t = useTranslations('onboarding')
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const [gender, setGender] = useState<string | null>(null)
  const [birthDate, setBirthDate] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [goal, setGoal] = useState<string | null>(null)
  const [experience, setExperience] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const step: Step = STEPS[stepIndex]

  const canContinue =
    step === 'gender'
      ? gender !== null
      : step === 'birthday'
        ? birthDate !== ''
        : step === 'height'
          ? Number(heightCm) >= 100 && Number(heightCm) <= 250
          : step === 'weight'
            ? Number(weightKg.replace(',', '.')) > 20
            : step === 'goal'
              ? goal !== null
              : experience !== null

  const finish = async (skipped = false) => {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      await sdk.update({
        collection: 'clients',
        id: clientId,
        depth: 0,
        data: {
          onboardedAt: new Date().toISOString(),
          ...(skipped
            ? {}
            : {
                profile: {
                  gender: (gender ?? undefined) as never,
                  birthDate: birthDate ? new Date(`${birthDate}T12:00:00`).toISOString() : undefined,
                  heightCm: heightCm ? Number(heightCm) : undefined,
                  goal: (goal ?? undefined) as never,
                  experience: (experience ?? undefined) as never,
                },
              }),
        },
      })
      const weight = Number(weightKg.replace(',', '.'))
      if (!skipped && Number.isFinite(weight) && weight > 20) {
        await sdk.create({
          collection: 'body-measurements',
          depth: 0,
          data: {
            measuredAt: new Date().toISOString(),
            weightKg: Math.round(weight * 4) / 4,
          },
        })
      }
      router.push('/')
      router.refresh()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('error'))
      setSaving(false)
    }
  }

  const next = () => {
    if (stepIndex < STEPS.length - 1) setStepIndex((index) => index + 1)
    else void finish()
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6">
      {/* Top bar: back, progress, skip */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
          aria-label={t('back')}
          className={`rounded-full p-2 text-ui-fg-muted transition-opacity ${stepIndex === 0 ? 'opacity-0' : ''}`}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-1 gap-1 px-4">
          {STEPS.map((_, index) => (
            <span
              key={index}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{
                background:
                  index <= stepIndex ? 'var(--color-stat-blue)' : 'var(--color-ui-border-base)',
              }}
            />
          ))}
        </div>
        <button
          type="button"
          className="text-sm font-medium text-ui-fg-muted"
          onClick={() => void finish(true)}
        >
          {t('skip')}
        </button>
      </div>

      <div className={statLabelClass} style={{ color: 'var(--color-stat-blue)' }}>
        ArmanOS
      </div>
      <h1 className="font-display mt-1 text-4xl font-bold uppercase leading-none tracking-wide text-ui-fg-base">
        {t(`q_${step}`)}
      </h1>

      {error && <Alert className="mt-4" onDismiss={() => setError(null)}>{error}</Alert>}

      <div className="fx-in mt-6 flex flex-col gap-2.5" key={step}>
        {step === 'gender' &&
          GENDERS.map((option) => (
            <OptionCard
              key={option}
              selected={gender === option}
              onClick={() => setGender(option)}
              title={t(`gender_${option}`)}
            />
          ))}

        {step === 'birthday' && (
          <Input
            className="w-full py-3 text-lg"
            type="date"
            value={birthDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(event) => setBirthDate(event.target.value)}
          />
        )}

        {step === 'height' && (
          <div className="flex items-baseline gap-2">
            <Input
              className="w-32 py-3 text-center font-display text-3xl font-bold tabular-nums"
              type="number"
              min={100}
              max={250}
              inputMode="numeric"
              placeholder="175"
              value={heightCm}
              onChange={(event) => setHeightCm(event.target.value)}
              autoFocus
            />
            <span className={statLabelClass}>cm</span>
          </div>
        )}

        {step === 'weight' && (
          <div className="flex items-baseline gap-2">
            <Input
              className="w-32 py-3 text-center font-display text-3xl font-bold tabular-nums"
              type="number"
              min={20}
              max={400}
              step="0.25"
              inputMode="decimal"
              placeholder="80"
              value={weightKg}
              onChange={(event) => setWeightKg(event.target.value)}
              autoFocus
            />
            <span className={statLabelClass}>kg</span>
          </div>
        )}

        {step === 'goal' &&
          GOALS.map((option) => (
            <OptionCard
              key={option}
              selected={goal === option}
              onClick={() => setGoal(option)}
              title={t(`goal_${option}`)}
            />
          ))}

        {step === 'experience' &&
          LEVELS.map((option) => (
            <OptionCard
              key={option}
              selected={experience === option}
              onClick={() => setExperience(option)}
              title={t(`level_${option}`)}
              subtitle={t(`level_${option}_sub`)}
            />
          ))}
      </div>

      <div className="mt-auto pt-8">
        <p className="mb-3 text-center text-xs text-ui-fg-muted">{t('privacy')}</p>
        <Button
          className="fx-btn-glow font-display w-full gap-2 py-3 text-base font-semibold uppercase tracking-[0.14em]"
          disabled={!canContinue || saving}
          onClick={next}
        >
          {saving ? '…' : stepIndex === STEPS.length - 1 ? t('finish') : t('continue')}
        </Button>
      </div>
    </div>
  )
}
