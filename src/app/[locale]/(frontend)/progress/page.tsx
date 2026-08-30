import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { LogoutButton } from '@/components/common/logout-button'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { ProgressChart } from '@/modules/training/components/progress-chart'
import {
  loadExerciseProgress,
  resolveHistoryViewer,
} from '@/modules/training/logs/server'

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>
}) {
  const { client } = await searchParams
  const viewer = await resolveHistoryViewer(client)
  if (!viewer) redirect('/login')
  if (viewer.clientId === null) redirect('/admin')

  const t = await getTranslations('progress')
  const series = await loadExerciseProgress(viewer.clientId)

  return (
    <PageContainer>
      <div className="pb-6">
        <PageHeader
          className="mb-4 sm:mb-7"
          title={t('title')}
          subtitle={t('subtitle')}
          right={viewer.kind === 'client' ? <LogoutButton /> : undefined}
        />

        {series.length === 0 ? (
          <div className="py-10 text-center text-sm text-ui-fg-muted">{t('empty')}</div>
        ) : (
          <ProgressChart series={series} />
        )}
      </div>
    </PageContainer>
  )
}
