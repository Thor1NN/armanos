import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import LogoutButton from './LogoutButton'
import type { TWorkout } from './WorkoutTracker'
import { WorkoutPlansAccordion, type TPlanAccordionItem } from './components/WorkoutPlansAccordion'

const STATUS_LABEL: Record<string, string> = {
  active: 'Aktywny',
  paused: 'Wstrzymany',
  completed: 'Zakończony',
}

export default async function HomePage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers })

  // Tylko zalogowany klient; admini/niezalogowani → na logowanie
  if (!user || user.collection !== 'clients') {
    redirect('/login')
  }

  const plans = await payload.find({
    collection: 'plans',
    where: { client: { equals: user.id } },
    sort: '-createdAt',
    depth: 0,
    limit: 100,
  })

  const planIds = plans.docs.map((p) => p.id)

  const microcycles = planIds.length
    ? await payload.find({
        collection: 'microcycles',
        where: { plan: { in: planIds } },
        sort: 'order',
        depth: 0,
        limit: 500,
      })
    : { docs: [] }

  const mcIds = microcycles.docs.map((m) => m.id)

  const workouts = mcIds.length
    ? await payload.find({
        collection: 'workouts',
        where: { microcycle: { in: mcIds } },
        sort: 'order',
        depth: 1, // populuje relację `exercise` w wierszach (wideo/opis z katalogu)
        limit: 1000,
      })
    : { docs: [] }

  const relId = (rel: unknown): number | string | undefined =>
    rel && typeof rel === 'object' ? (rel as { id: number | string }).id : (rel as number | string)

  const mcByPlan = (planId: number | string) =>
    microcycles.docs.filter((m) => relId(m.plan) === planId)
  const woByMc = (mcId: number | string) =>
    workouts.docs.filter((w) => relId(w.microcycle) === mcId)

  // Parametry ćwiczenia → lista czytelnych etykiet (pomija puste / "x")
  const fmtDuration = (min?: number | null, sec?: number | null): string | null => {
    const m = min ?? 0
    const s = sec ?? 0
    if (!m && !s) return null
    const p: string[] = []
    if (m) p.push(`${m} min`)
    if (s) p.push(`${s} sek`)
    return p.join(' ')
  }

  const exMeta = (ex: {
    series?: string | null
    reps?: string | null
    durationMin?: number | null
    durationSec?: number | null
    rest?: string | null
    tut?: string | null
    rir?: string | null
    kg?: string | null
    extra?: string | null
  }): string[] => {
    const parts: string[] = []
    const ok = (v?: string | null) => v && v.trim() !== '' && v.trim().toLowerCase() !== 'x'
    if (ok(ex.series)) parts.push(`Serie: ${ex.series}`)
    if (ok(ex.reps)) parts.push(`Powt.: ${ex.reps}`)
    const dur = fmtDuration(ex.durationMin, ex.durationSec)
    if (dur) parts.push(`Czas: ${dur}`)
    if (ok(ex.rest)) parts.push(`Przerwa: ${ex.rest}`)
    if (ok(ex.tut)) parts.push(`TUT: ${ex.tut}`)
    if (ok(ex.rir)) parts.push(`RIR: ${ex.rir}`)
    if (ok(ex.kg)) parts.push(`${ex.kg} kg`)
    if (ok(ex.extra)) parts.push(ex.extra as string)
    return parts
  }

  // Dokument Workout → serializowalny kształt dla komponentu klienckiego (z id wierszy)
  const serializeWorkout = (w: (typeof workouts.docs)[number]): TWorkout => ({
    id: w.id,
    title: w.title,
    rpe: w.rpe ?? null,
    sections: (w.sections || []).map((section) => ({
      title: section.title ?? null,
      subtitle: section.subtitle ?? null,
      groups: (section.groups || []).map((group) => ({
        setType: group.setType ?? null,
        exercises: (group.exercises || []).map((ex) => {
          const cat = ex.exercise && typeof ex.exercise === 'object' ? ex.exercise : null
          const name = cat?.name || ex.note || ''
          const extraNote = cat && ex.note && ex.note !== cat.name ? ex.note : null
          return {
            rowId: String(ex.id),
            numer: ex.numer ?? null,
            name,
            note: extraNote,
            exerciseId: cat?.id ?? (typeof ex.exercise === 'number' ? ex.exercise : null),
            exerciseName: name,
            trackingType: cat?.trackingType ?? null,
            videoUrl: cat?.videoUrl ?? null,
            meta: exMeta(ex),
            prefill: { reps: ex.reps ?? null, rir: ex.rir ?? null },
          }
        }),
      })),
    })),
  })

  const accordionPlans: TPlanAccordionItem[] = plans.docs.map((plan) => {
    const status = (plan.status as string) || 'active'

    return {
      id: plan.id,
      title: plan.title,
      status,
      statusLabel: STATUS_LABEL[status] || status,
      dateRange:
        plan.startDate || plan.endDate
          ? [plan.startDate, plan.endDate]
              .map((d) => (d ? new Date(d).toLocaleDateString('pl-PL') : '…'))
              .join(' – ')
          : null,
      description: plan.description ?? null,
      microcycles: mcByPlan(plan.id).map((mc) => ({
        id: mc.id,
        title: mc.title,
        rpe: mc.rpe ?? null,
        workouts: woByMc(mc.id).map((w) => serializeWorkout(w)),
      })),
    }
  })

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-6 sm:py-8">
      <div className="mb-7 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-app-text">Cześć, {user.name || user.email} 👋</h1>
          <span className="mt-1 block text-xs text-app-muted">Twoje plany treningowe</span>
        </div>
        <LogoutButton />
      </div>

      {plans.docs.length === 0 && (
        <div className="py-10 text-center text-sm text-app-muted">
          Nie masz jeszcze przypisanego planu. Skontaktuj się z trenerem.
        </div>
      )}

      {plans.docs.length > 0 && <WorkoutPlansAccordion plans={accordionPlans} />}
    </div>
  )
}
