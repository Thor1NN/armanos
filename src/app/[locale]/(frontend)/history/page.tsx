import { redirect } from 'next/navigation'
import { getFormatter, getTranslations } from 'next-intl/server'
import { AppNav } from '@/components/common/app-nav'
import { LogoutButton } from '@/components/common/logout-button'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { formatSetLogSummary } from '@/modules/training/logs'
import {
  loadWorkoutHistory,
  resolveHistoryViewer,
} from '@/modules/training/logs/server'
import type { SetLog } from '@/payload-types'

const groupByExercise = (sets: SetLog[]): Array<{ name: string; sets: SetLog[] }> => {
  const groups: Array<{ name: string; sets: SetLog[] }> = []
  for (const set of sets) {
    const name = set.exerciseName?.trim() || '—'
    const last = groups[groups.length - 1]
    if (last && last.name === name) last.sets.push(set)
    else groups.push({ name, sets: [set] })
  }
  return groups
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>
}) {
  const { client } = await searchParams
  const viewer = await resolveHistoryViewer(client)
  if (!viewer) redirect('/login')
  if (viewer.clientId === null) redirect('/admin')

  const t = await getTranslations('history')
  const format = await getFormatter()
  const history = await loadWorkoutHistory(viewer.clientId)

  return (
    <PageContainer>
      <div className="pb-16">
        <PageHeader
          className="mb-4 sm:mb-7"
          title={t('title')}
          subtitle={t('subtitle')}
          right={viewer.kind === 'client' ? <LogoutButton /> : undefined}
        />

        {history.length === 0 ? (
          <div className="py-10 text-center text-sm text-ui-fg-muted">{t('empty')}</div>
        ) : (
          <ul className="flex list-none flex-col gap-3 p-0">
            {history.map(({ session, sets }) => (
              <li
                key={session.id}
                className="rounded-xl border border-ui-border-base bg-ui-bg-component px-4 py-3"
              >
                <div className="flex items-baseline justify-between gap-2 text-sm font-semibold">
                  <span className="break-words">{session.title || t('sessionFallback')}</span>
                  {session.completedAt && (
                    <span className="shrink-0 text-xs font-normal text-ui-fg-muted">
                      {format.dateTime(new Date(session.completedAt), { dateStyle: 'medium' })}
                    </span>
                  )}
                </div>
                {sets.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {groupByExercise(sets).map((group, index) => (
                      <div key={index} className="text-xs">
                        <span className="font-medium text-ui-fg-base">{group.name}</span>
                        <span className="text-ui-fg-muted">
                          {' — '}
                          {group.sets.map((set) => formatSetLogSummary(set)).join(' | ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {session.notes && (
                  <p className="mt-2 text-xs text-ui-fg-muted">{session.notes}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {viewer.kind === 'client' && <AppNav />}
    </PageContainer>
  )
}
