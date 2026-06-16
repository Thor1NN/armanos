import React from 'react'
import { joinClasses, mutedTextClass } from '@/lib/class-names'

type FieldProps = {
  label: string
  children: React.ReactNode
  className?: string
  labelClassName?: string
}

export function Field({ label, children, className, labelClassName }: FieldProps) {
  return (
    <div className={joinClasses('flex flex-col gap-1', className)}>
      <span className={joinClasses('text-xs', mutedTextClass, labelClassName)}>{label}</span>
      {children}
    </div>
  )
}
