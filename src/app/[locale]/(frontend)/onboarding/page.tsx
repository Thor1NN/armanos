import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { OnboardingWizard } from '@/modules/training/components/onboarding'

export default async function OnboardingPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers })

  if (!user || user.collection !== 'clients') redirect('/login')
  if (user.onboardedAt) redirect('/')

  return <OnboardingWizard clientId={user.id} />
}
