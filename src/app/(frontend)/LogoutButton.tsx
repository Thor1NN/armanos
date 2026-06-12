'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const onClick = async () => {
    setLoading(true)
    await fetch('/api/clients/logout', { method: 'POST' }).catch(() => null)
    router.push('/login')
    router.refresh()
  }

  return (
    <button className="btn-ghost" onClick={onClick} disabled={loading}>
      {loading ? '…' : 'Wyloguj'}
    </button>
  )
}
