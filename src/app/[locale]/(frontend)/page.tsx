import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { loadTrainingPlans } from '@/modules/training/plans/server'
import { WorkoutPlans } from '@/modules/training/components/workout-plans'
import { AppNav } from '@/components/common/app-nav'
import { LogoutButton } from '@/components/common/logout-button'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'

export default async function HomePage() {
  const t = await getTranslations('home')
  const result = await loadTrainingPlans()

  if (!result.user) redirect('/login')

  return (
    <PageContainer>
      <div className="pb-16">
        <PageHeader
          className="mb-4 sm:mb-7"
          title={t('greeting', { name: result.user.name || result.user.email || '' })}
          subtitle={t('yourTrainingPlans')}
          right={<LogoutButton />}
        />

        {result.plans.length > 0 ? (
          <WorkoutPlans plans={result.plans} />
        ) : (
          <div className="py-10 text-center text-sm text-ui-fg-muted">{t('noPlans')}</div>
        )}
      </div>
      <AppNav />
    </PageContainer>
  )
}
