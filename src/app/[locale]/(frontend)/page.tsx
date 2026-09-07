import { redirect } from 'next/navigation'
import { getFormatter, getTranslations } from 'next-intl/server'
import { CheckCircle2 } from 'lucide-react'
import { statLabelClass } from '@/lib/class-names'
import { loadTrainingPlans } from '@/modules/training/plans/server'
import { loadExerciseProgress, loadWorkoutHistory } from '@/modules/training/logs/server'
import { HomeShell } from '@/modules/training/components/home-shell'
import { ProgressChart } from '@/modules/training/components/progress-chart'
import { WeekStrip } from '@/modules/training/components/week-strip'
import { BodyCard } from '@/modules/training/components/body-card'
import { ReportsCard } from '@/modules/training/components/reports-card'
import { PageContainer } from '@/components/ui/page-container'
import { formatSetLogSummary } from '@/modules/training/logs'

export default async function HomePage() {
  const td = await getTranslations('dashboard')
  const format = await getFormatter()
  const result = await loadTrainingPlans()

  if (!result.user) redirect('/login')
  if (!result.user.onboardedAt) redirect('/onboarding')

  const clientId = Number(result.user.id)
  const [history, progress] = await Promise.all([
    loadWorkoutHistory(clientId),
    loadExerciseProgress(clientId),
  ])
  const completedDates = history
    .map(({ session }) => session.completedAt)
    .filter((value): value is string => Boolean(value))
  const recent = history.slice(0, 3)

  // Everything lives on one scrolling dashboard — WHOOP-style card stack.
  const dashboard = (
    <>
      <WeekStrip completedDates={completedDates} />

      <ReportsCard />

      <BodyCard />

      {recent.length > 0 && (
        <section className="fx-card p-4">
          <div className={`mb-3 ${statLabelClass}`}>{td('recentLabel')}</div>
          <ul className="flex list-none flex-col gap-2.5 p-0">
            {recent.map(({ session, sets }) => (
              <li key={session.id} className="border-t border-ui-border-base pt-2.5 first:border-t-0 first:pt-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                    <CheckCircle2
                      size={15}
                      className="shrink-0"
                      style={{ color: 'var(--color-stat-green)' }}
                    />
                    <span className="truncate">{session.title || td('sessionFallback')}</span>
                  </span>
                  {session.completedAt && (
                    <span className={`shrink-0 ${statLabelClass}`}>
                      {format.dateTime(new Date(session.completedAt), {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  )}
                </div>
                {sets.length > 0 && (
                  <p className="mt-1 truncate text-xs text-ui-fg-muted">
                    {sets
                      .slice(0, 3)
                      .map((set) => formatSetLogSummary(set))
                      .join(' | ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {progress.length > 0 && (
        <section>
          <div className={`mb-2 px-1 ${statLabelClass}`}>{td('progressLabel')}</div>
          <ProgressChart series={progress} />
        </section>
      )}
    </>
  )

  const displayName = (result.user.name || result.user.email || '').split(' ')[0]

  return (
    <PageContainer>
      <div className="pb-6">

        <HomeShell
          clientId={result.user.id}
          displayName={displayName}
          plans={result.plans}
          dailyKcalTarget={result.user.dailyKcalTarget ?? null}
          dashboard={dashboard}
        />
      </div>
    </PageContainer>
  )
}
