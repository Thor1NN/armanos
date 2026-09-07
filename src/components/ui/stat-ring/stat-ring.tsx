'use client'

import React, { useEffect, useId, useState } from 'react'

const COLORS = {
  blue: { stroke: 'var(--color-stat-blue)' },
  green: { stroke: 'var(--color-stat-green)' },
  red: { stroke: 'var(--color-stat-red)' },
  amber: { stroke: 'var(--color-stat-amber)' },
} as const

export type StatRingColor = keyof typeof COLORS

const VIEWBOX = 100

/** True when the user asked the OS for less motion. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    // Reading the media query in an effect keeps SSR output stable.
    const timer = setTimeout(update, 0)
    query.addEventListener('change', update)
    return () => {
      clearTimeout(timer)
      query.removeEventListener('change', update)
    }
  }, [])
  return reduced
}

/**
 * Circular progress gauge. Scales with its container when `responsive`
 * (viewBox-based SVG), otherwise renders at `size` px. The arc fills once on
 * mount unless the user prefers reduced motion; values are always readable
 * without the animation because the center content is plain text.
 */
export function StatRing({
  value,
  color = 'blue',
  size = 120,
  strokeWidth = 8,
  responsive = false,
  label,
  children,
}: {
  value: number
  color?: StatRingColor
  size?: number
  strokeWidth?: number
  responsive?: boolean
  /** Accessible name for the gauge. */
  label?: string
  children?: React.ReactNode
}) {
  const uid = useId()
  const reducedMotion = usePrefersReducedMotion()
  const clamped = Math.max(0, Math.min(100, value))

  // Draw-in: start empty, then sweep to the value (skipped for reduced motion).
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])
  const display = reducedMotion || mounted ? clamped : 0

  const radius = (VIEWBOX - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dash = (display / 100) * circumference
  const stroke = COLORS[color].stroke

  return (
    <div
      className={responsive ? 'relative aspect-square w-full' : 'relative inline-flex'}
      style={responsive ? undefined : { width: size, height: size }}
      role="img"
      aria-label={label ? `${label}: ${Math.round(clamped)}%` : undefined}
    >
      <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} width="100%" height="100%" className="-rotate-90" aria-hidden>
        <circle cx={VIEWBOX / 2} cy={VIEWBOX / 2} r={radius} fill="none" strokeWidth={strokeWidth} stroke="rgba(15,23,42,0.08)" />
        <circle
          id={uid}
          cx={VIEWBOX / 2}
          cy={VIEWBOX / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={stroke}
          strokeDasharray={`${dash} ${circumference - dash}`}
          style={{
            transition: reducedMotion ? 'none' : 'stroke-dasharray 500ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">{children}</div>
    </div>
  )
}
