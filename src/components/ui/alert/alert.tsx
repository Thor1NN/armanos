'use client'

import React from 'react'
import { X } from 'lucide-react'
import { errorBannerClass, joinClasses } from '@/lib/class-names'
import { Button } from '@/components/ui/button'

type AlertProps = {
  children: React.ReactNode
  className?: string
  onDismiss?: () => void
  dismissLabel?: string
}

export function Alert({ children, className, onDismiss, dismissLabel = 'Zamknij' }: AlertProps) {
  return (
    <div className={joinClasses(errorBannerClass, className)} role="alert">
      {children}
      {onDismiss && (
        <Button
          variant="icon"
          className="ml-3 inline-flex align-middle opacity-70 hover:opacity-100"
          onClick={onDismiss}
          aria-label={dismissLabel}
        >
          <X size={13} strokeWidth={2.5} />
        </Button>
      )}
    </div>
  )
}
