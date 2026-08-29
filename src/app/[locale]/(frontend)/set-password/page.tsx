'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { Suspense, useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/ui/logo'
import { Surface } from '@/components/ui/surface'

/**
 * Invite / password-reset landing page. The coach generates a link with a
 * one-time token from the admin panel; the client sets their password here.
 */
function SetPasswordForm() {
  const t = useTranslations('setPassword')
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError(t('mismatch'))
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/clients/reset-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.errors?.[0]?.message || t('invalidToken'))
        return
      }
      router.push('/')
      router.refresh()
    } catch {
      setError(t('genericError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-6">
      <Surface as="form" className="w-full max-w-sm p-6 sm:p-8" onSubmit={onSubmit}>
        <div className="mb-6 flex justify-center">
          <Logo className="h-24 w-auto" />
        </div>
        <h1 className="text-xl font-semibold text-ui-fg-base">{t('title')}</h1>
        <p className="mt-1 mb-6 text-sm text-ui-fg-muted">{t('subtitle')}</p>

        {!token && <Alert className="mb-4">{t('missingToken')}</Alert>}
        {error && <Alert className="mb-4">{error}</Alert>}

        <Field label={t('passwordLabel')} htmlFor="password" className="mb-4">
          <Input
            className="w-full"
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={15}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Field label={t('confirmLabel')} htmlFor="confirm" className="mb-4">
          <Input
            className="w-full"
            id="confirm"
            type="password"
            autoComplete="new-password"
            minLength={15}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </Field>
        <p className="mb-4 text-xs text-ui-fg-muted">{t('passwordHint')}</p>

        <Button className="mt-2 w-full" type="submit" disabled={loading || !token}>
          {loading ? t('saving') : t('button')}
        </Button>
      </Surface>
    </div>
  )
}

export default function SetPasswordPage() {
  return (
    <Suspense>
      <SetPasswordForm />
    </Suspense>
  )
}
