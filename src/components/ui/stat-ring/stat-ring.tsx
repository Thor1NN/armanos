'use client'

import React, { useEffect, useId, useState } from 'react'

const COLORS = {
  blue: { from: '#2563eb', to: '#4ccfff', glow: 'var(--color-stat-blue)' },
  green: { from: '#0ea55b', to: '#5dffa8', glow: 'var(--color-stat-green)' },
  red: { from: '#dc2626', to: '#ff7a85', glow: 'var(--color-stat-red)' },
  amber: { from: '#d97706', to: '#ffd166', glow: 'var(--color-stat-amber)' },
} as const

export type StatRingColor = keyof typeof COLORS

/**
 * Animated dashboard gauge: gradient ring that sweeps in on mount, with a
 * soft glow and arbitrary center content. `value` is 0–100.
 */
export function StatRing({
  value,
  color = 'blue',
  size = 120,
  strokeWidth = 8,
  children,
}: {
  value: number
  color?: StatRingColor
  size?: number
  strokeWidth?: number
  children?: React.ReactNode
}) {
  const gradientId = useId()
  const clamped = Math.max(0, Math.min(100, value))
  // Start at 0 and sweep to the value so the ring draws itself in.
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setDisplay(clamped))
    return () => cancelAnimationFrame(raf)
  }, [clamped])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dash = (display / 100) * circumference
  const palette = COLORS[color]

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.from} />
            <stop offset="100%" stopColor={palette.to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke="rgba(255,255,255,0.06)"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={`url(#${gradientId})`}
          strokeDasharray={`${dash} ${circumference - dash}`}
          style={{
            filter: `drop-shadow(0 0 ${strokeWidth + 2}px color-mix(in srgb, ${palette.glow} 55%, transparent))`,
            transition: 'stroke-dasharray 950ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  )
}

/** Eased number count-up for stat numerals. */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf = 0
    const startTime = performance.now()
    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration)
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

/** Animated numeral — renders the count-up inline. */
export function CountUp({ value }: { value: number }) {
  return <>{useCountUp(value)}</>
}
