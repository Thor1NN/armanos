'use client'

import React, { useState } from 'react'
import { formatMmSs, parseMmSs } from '@/lib/date'
import { Input } from '@/components/ui/input'

export function DurationInput({
  initialMin,
  initialSec,
  autoFocus,
  onCommit,
  className,
}: {
  initialMin: string
  initialSec: string
  autoFocus?: boolean
  onCommit: (min: string, sec: string) => void
  className?: string
}) {
  const [display, setDisplay] = useState(() => formatMmSs(initialMin, initialSec))

  const handleBlur = () => {
    const { min, sec } = parseMmSs(display)
    setDisplay(formatMmSs(min, sec))
    onCommit(min, sec)
  }

  return (
    <Input
      variant="compact"
      type="text"
      inputMode="numeric"
      placeholder="00:00"
      autoFocus={autoFocus}
      value={display}
      className={className}
      onChange={(event) => setDisplay(event.target.value)}
      onBlur={handleBlur}
    />
  )
}
