'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { errorBannerClass } from '../ui'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Surface } from '../components/ui/Surface'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/clients/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.errors?.[0]?.message || 'Nieprawidłowy e-mail lub hasło.')
        setLoading(false)
        return
      }
      // cookie payload-token ustawione przez Payload — przechodzimy do dashboardu
      router.push('/')
      router.refresh()
    } catch {
      setError('Coś poszło nie tak. Spróbuj ponownie.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-6">
      <Surface as="form" className="w-full max-w-sm p-6 sm:p-8" onSubmit={onSubmit}>
        <div className="mb-6 flex justify-center">
          <img src="/images/logo.svg" alt="Logo" className="h-24 w-auto" />
        </div>
        <h1 className="text-xl font-semibold text-ui-fg-base">Zaloguj się</h1>
        <p className="mt-1 mb-6 text-sm text-ui-fg-muted">Wpisz dane otrzymane od trenera.</p>

        {error && <div className={`mb-4 ${errorBannerClass}`}>{error}</div>}

        <div className="mb-4">
          <label className="mb-1.5 block text-xs text-ui-fg-muted" htmlFor="email">
            E-mail
          </label>
          <Input
            className="w-full"
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="mb-1.5 block text-xs text-ui-fg-muted" htmlFor="password">
            Hasło
          </label>
          <Input
            className="w-full"
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button className="mt-2 w-full" type="submit" disabled={loading}>
          {loading ? 'Logowanie…' : 'Zaloguj'}
        </Button>
      </Surface>
    </div>
  )
}
