import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { AppNav } from '@/components/common/app-nav'
import { LogoutButton } from '@/components/common/logout-button'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { DiaryScreen } from '@/modules/training/components/diary'
import { resolveHistoryViewer } from '@/modules/training/logs/server'

export default async function DiaryPage() {
  const viewer = await resolveHistoryViewer()
  if (!viewer) redirect('/login')
  // Coaches read diaries in the admin panel; this screen is the client's own.
  if (viewer.kind !== 'client') redirect('/admin')

  const t = await getTranslations('diary')

  return (
    <PageContainer>
      <div className="pb-16">
        <PageHeader
          className="mb-4 sm:mb-7"
          title={t('title')}
          subtitle={t('subtitle')}
          right={<LogoutButton />}
        />
        <DiaryScreen />
      </div>
      <AppNav />
    </PageContainer>
  )
}
