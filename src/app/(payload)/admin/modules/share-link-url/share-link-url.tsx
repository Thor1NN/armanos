'use client'

import React, { useState } from 'react'
import { useFormFields } from '@payloadcms/ui'

export function ShareLinkUrl() {
  const [copied, setCopied] = useState(false)
  const token = useFormFields(([fields]) => fields.token?.value as string | undefined)

  if (!token) {
    return (
      <div style={{ fontSize: 11, color: '#6b7280', padding: '4px 0' }}>
        URL will appear after first save.
      </div>
    )
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
  const url = `${base}/share/${token}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
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
        {url}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        style={{
          alignSelf: 'flex-start',
          fontSize: 11,
          fontWeight: 600,
          padding: '3px 10px',
          borderRadius: 6,
          border: '1px solid #d1d5db',
          background: copied ? '#d1fae5' : '#fff',
          color: copied ? '#065f46' : '#374151',
          cursor: 'pointer',
        }}
      >
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  )
}
