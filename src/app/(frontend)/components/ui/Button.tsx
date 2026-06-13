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

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

const variantClass: Record<Variant, string> = {
  primary: primaryButtonClass,
  secondary: secondaryButtonClass,
  dashed: dashedButtonClass,
  icon: iconButtonClass,
  danger: dangerIconButtonClass,
  ghost: 'cursor-pointer text-left transition-colors',
}

export function Button({
  className,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return <button className={joinClasses(variantClass[variant], className)} type={type} {...props} />
}
