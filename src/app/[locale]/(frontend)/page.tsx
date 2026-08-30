import { redirect } from 'next/navigation'
import { getFormatter, getTranslations } from 'next-intl/server'
import { CheckCircle2 } from 'lucide-react'
import { statLabelClass } from '@/lib/class-names'
import { loadTrainingPlans } from '@/modules/training/plans/server'
import { loadExerciseProgress, loadWorkoutHistory } from '@/modules/training/logs/server'
import { TodayHome } from '@/modules/training/components/today-home'
import { DiaryScreen } from '@/modules/training/components/diary'
import { ProgressChart } from '@/modules/training/components/progress-chart'
import { WeekStrip } from '@/modules/training/components/week-strip'
import { LogoutButton } from '@/components/common/logout-button'
import { PageContainer } from '@/components/ui/page-container'
import { formatSetLogSummary } from '@/modules/training/logs'

export default async function HomePage() {
  const t = await getTranslations('home')
  const td = await getTranslations('dashboard')
  const format = await getFormatter()
  const result = await loadTrainingPlans()

  if (!result.user) redirect('/login')

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

      <section className="fx-card fx-in p-4" style={{ animationDelay: '260ms' }}>
        <div className={`mb-3 ${statLabelClass}`}>{td('nutritionLabel')}</div>
        <DiaryScreen />
      </section>

      {recent.length > 0 && (
        <section className="fx-card fx-in p-4" style={{ animationDelay: '320ms' }}>
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
        <section className="fx-in" style={{ animationDelay: '380ms' }}>
          <div className={`mb-2 px-1 ${statLabelClass}`}>{td('progressLabel')}</div>
          <ProgressChart series={progress} />
        </section>
      )}
    </>
  )

  const displayName = (result.user.name || result.user.email || '').split(' ')[0]
  const today = new Date()

  return (
    <PageContainer>
      <div className="pb-6">
        <header className="fx-in mb-5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className={statLabelClass} style={{ color: 'var(--color-stat-blue)' }}>
              ArmanOS · {format.dateTime(today, { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <h1 className="font-display mt-1 truncate text-4xl font-bold uppercase leading-none tracking-wide text-ui-fg-base">
              {displayName}
            </h1>
          </div>
          <LogoutButton />
        </header>

        {result.plans.length > 0 ? (
          <TodayHome plans={result.plans} dailyKcalTarget={result.user.dailyKcalTarget} dashboard={dashboard} />
        ) : (
          <div className="space-y-3">
            <div className="py-6 text-center text-sm text-ui-fg-muted">{t('noPlans')}</div>
            {dashboard}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
