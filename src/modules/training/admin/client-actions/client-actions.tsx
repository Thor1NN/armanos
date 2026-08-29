'use client'

import React, { useState } from 'react'
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
  textDecoration: 'none',
}

/**
 * Coach actions on a client document: invite link (one-time set-password
 * URL), CSV export of the full workout history, and links to the client's
 * history/progress views.
 */
export function ClientActions() {
  const { id } = useDocumentInfo()
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!id) {
    return (
      <div style={{ fontSize: 11, color: '#6b7280', padding: '4px 0' }}>
        Save the client first to enable invite links and exports.
      </div>
    )
  }

  const generateInvite = async () => {
    setGenerating(true)
    setInviteError(null)
    try {
      const res = await fetch(`/api/clients/${id}/invite`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message ?? 'Failed to generate the link')
      setInviteUrl(data.url)
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : 'Failed to generate the link')
    } finally {
      setGenerating(false)
    }
  }

  const copyInvite = async () => {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <button type="button" style={buttonStyle} onClick={generateInvite} disabled={generating}>
          {generating ? 'Generating…' : 'Generate invite / reset link'}
        </button>
        <a style={buttonStyle} href={`/api/clients/${id}/export`}>
          Download history (CSV)
        </a>
        <a style={buttonStyle} href={`/history?client=${id}`} target="_blank" rel="noreferrer">
          View history
        </a>
        <a style={buttonStyle} href={`/progress?client=${id}`} target="_blank" rel="noreferrer">
          View progress
        </a>
      </div>

      {inviteError && <div style={{ fontSize: 11, color: '#b91c1c' }}>{inviteError}</div>}

      {inviteUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            style={{
              fontSize: 11,
              color: '#6b7280',
              wordBreak: 'break-all',
              background: '#f3f4f6',
              borderRadius: 6,
              padding: '5px 8px',
              fontFamily: 'monospace',
            }}
          >
            {inviteUrl}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>
            Valid for 1 hour. Send it to the client — they will set their own password.
          </div>
          <button
            type="button"
            onClick={copyInvite}
            style={{
              ...buttonStyle,
              background: copied ? '#d1fae5' : '#fff',
              color: copied ? '#065f46' : '#374151',
            }}
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  )
}
