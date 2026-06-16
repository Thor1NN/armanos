import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { loadTrainingPlans } from '@/loaders/training-plan-loader'
import { WorkoutPlans } from '@/components/workout/workout-plans'
import { LogoutButton } from '@/components/common/logout-button'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'

export default async function HomePage() {
  const t = await getTranslations('home')
  const result = await loadTrainingPlans()

  if (!result.user) redirect('/login')

  return (
    <PageContainer>
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
    </PageContainer>
  )
}
