'use client'

import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { joinClasses } from '@/lib/class-names'

/**
 * Mobile-first modal sheet anchored to the bottom (centered on wide
 * screens). Closes on backdrop tap and Escape, traps initial focus on the
 * panel, and respects the device safe area.
 */
export function BottomSheet({
  open,
  title,
  onClose,
  children,
  closeLabel = 'Close',
}: {
  open: boolean
  title?: string
  onClose: () => void
  children: React.ReactNode
  closeLabel?: string
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = setTimeout(() => panelRef.current?.focus(), 0)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      clearTimeout(focusTimer)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="sheet-backdrop absolute inset-0 bg-black/35" aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={joinClasses(
          'sheet-panel relative w-full max-w-lg rounded-t-3xl bg-ui-bg-component shadow-2xl outline-none sm:rounded-3xl',
          'max-h-[92dvh] overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3',
        )}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ui-border-strong sm:hidden" aria-hidden />
        <div className="mb-3 flex items-center justify-between gap-3">
          {title ? <h2 className="text-base font-semibold text-ui-fg-base">{title}</h2> : <span />}
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="rounded-full p-2 text-ui-fg-muted transition-colors hover:bg-ui-bg-subtle hover:text-ui-fg-base"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
