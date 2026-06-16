import React from 'react'
import { joinClasses, mutedTextClass } from '@/lib/class-names'

type FieldProps = {
  label: string
  children: React.ReactNode
  className?: string
  labelClassName?: string
  /** When set, the label renders as a real `<label htmlFor>` instead of a `<span>`. */
  htmlFor?: string
}

export function Field({ label, children, className, labelClassName, htmlFor }: FieldProps) {
  const labelClasses = joinClasses('text-xs', mutedTextClass, labelClassName)
  return (
    <div className={joinClasses('flex flex-col gap-1', className)}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className={labelClasses}>
          {label}
        </label>
      ) : (
        <span className={labelClasses}>{label}</span>
      )}
      {children}
    </div>
  )
}
