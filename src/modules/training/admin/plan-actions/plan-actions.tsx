'use client'

import React, { useEffect, useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

const buttonStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  fontSize: 11,
  fontWeight: 600,
  padding: '4px 10px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
  background: '#fff',
  color: '#374151',
  cursor: 'pointer',
}

type ClientOption = { id: number; name?: string | null; email?: string | null }

/**
 * "Duplicate plan" action: deep-copies this plan (microcycles → workouts →
 * groups → exercise rows) to the selected client. This is also how templates
 * work — keep a template plan and duplicate it when assigning.
 */
export function DuplicatePlan() {
  const { id } = useDocumentInfo()
  const [clients, setClients] = useState<ClientOption[]>([])
  const [targetClient, setTargetClient] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/clients?limit=200&depth=0&sort=name', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setClients(data?.docs ?? []))
      .catch(() => setClients([]))
  }, [])

  if (!id) return null

  const duplicate = async () => {
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`/api/plans/${id}/duplicate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: targetClient ? Number(targetClient) : undefined }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message ?? 'Duplication failed')
      setResult(
        `Copied to plan #${data.plan.id} (“${data.plan.title}”) — ${data.copied.workouts} workouts, ${data.copied.exerciseRows} exercise rows. Status: paused.`,
      )
    } catch (duplicateError) {
      setError(duplicateError instanceof Error ? duplicateError.message : 'Duplication failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>Duplicate plan</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <select
          value={targetClient}
          onChange={(event) => setTargetClient(event.target.value)}
          style={{ fontSize: 11, padding: '4px 6px', borderRadius: 6, border: '1px solid #d1d5db' }}
        >
          <option value="">No client (keep as template)</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name || client.email || `#${client.id}`}
            </option>
          ))}
        </select>
        <button type="button" style={buttonStyle} onClick={duplicate} disabled={busy}>
          {busy ? 'Copying…' : 'Duplicate'}
        </button>
      </div>
      {result && (
        <div style={{ fontSize: 11, color: '#065f46', background: '#d1fae5', borderRadius: 6, padding: '5px 8px' }}>
          {result}
        </div>
      )}
      {error && <div style={{ fontSize: 11, color: '#b91c1c' }}>{error}</div>}
    </div>
  )
}
