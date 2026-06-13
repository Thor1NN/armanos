'use client'

import React from 'react'
import {
  dangerIconButtonClass,
  dashedButtonClass,
  iconButtonClass,
  joinClasses,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../ui'

type Variant = 'primary' | 'secondary' | 'dashed' | 'icon' | 'danger' | 'ghost'
type Size = 'md' | 'sm'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

const variantClass: Record<Variant, string> = {
  primary: primaryButtonClass,
  secondary: secondaryButtonClass,
  dashed: dashedButtonClass,
  icon: iconButtonClass,
  danger: dangerIconButtonClass,
  ghost: 'cursor-pointer text-left transition-colors',
}

const sizeClass: Record<Size, string> = {
  md: '',
  sm: 'min-h-8 px-3 py-1 text-xs',
}

export function Button({
  className,
  type = 'button',
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={joinClasses(variantClass[variant], sizeClass[size], className)}
      type={type}
      {...props}
    />
  )
}
