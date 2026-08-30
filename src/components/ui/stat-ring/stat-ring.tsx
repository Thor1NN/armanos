'use client'

import React, { useEffect, useId, useState } from 'react'

const COLORS = {
  blue: { from: '#1d4ed8', to: '#4ccfff', glow: 'var(--color-stat-blue)' },
  green: { from: '#0a8a4d', to: '#5dffa8', glow: 'var(--color-stat-green)' },
  red: { from: '#b91c1c', to: '#ff7a85', glow: 'var(--color-stat-red)' },
  amber: { from: '#b45309', to: '#ffd166', glow: 'var(--color-stat-amber)' },
} as const

export type StatRingColor = keyof typeof COLORS

/**
 * Cinematic dashboard gauge: tick track, gradient arc with a blurred bloom
 * underlay, sweeps in on mount. `value` is 0–100. `live` adds a slow pulse
 * for in-progress metrics.
 */
export function StatRing({
  value,
  color = 'blue',
  size = 120,
  strokeWidth = 8,
  live = false,
  children,
}: {
  value: number
  color?: StatRingColor
  size?: number
  strokeWidth?: number
  live?: boolean
  children?: React.ReactNode
}) {
  const uid = useId()
  const gradientId = `${uid}-grad`
  const blurId = `${uid}-blur`
  const clamped = Math.max(0, Math.min(100, value))
  // Start at 0 and sweep to the value so the ring draws itself in.
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setDisplay(clamped))
    return () => cancelAnimationFrame(raf)
  }, [clamped])

  const radius = (size - strokeWidth) / 2 - 3
  const circumference = 2 * Math.PI * radius
  const dash = (display / 100) * circumference
  const palette = COLORS[color]
  const tickRadius = radius + strokeWidth / 2 + 3
  const arcTransition = 'stroke-dasharray 1100ms cubic-bezier(0.22, 1, 0.36, 1)'

  return (
    <div
      className={`relative inline-flex items-center justify-center ${live ? 'fx-pulse' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90 overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.from} />
            <stop offset="100%" stopColor={palette.to} />
          </linearGradient>
          <filter id={blurId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation={strokeWidth * 0.9} />
          </filter>
        </defs>

        {/* Tick track — the instrument-dial feel */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={tickRadius}
          fill="none"
          strokeWidth={2}
          stroke="rgba(15,23,42,0.14)"
          strokeDasharray="1.5 5.5"
        />

        {/* Base track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke="rgba(15,23,42,0.08)"
        />

        {/* Bloom underlay — blurred copy of the arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth + 2}
          strokeLinecap="round"
          stroke={palette.glow}
          opacity={0.55}
          filter={`url(#${blurId})`}
          strokeDasharray={`${dash} ${circumference - dash}`}
          style={{ transition: arcTransition }}
        />

        {/* Main gradient arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={`url(#${gradientId})`}
          strokeDasharray={`${dash} ${circumference - dash}`}
          style={{ transition: arcTransition }}
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
    // Hidden tabs suspend rAF — show the real value immediately there.
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      const snap = setTimeout(() => setValue(target), 0)
      return () => clearTimeout(snap)
    }
    let raf = 0
    const startTime = performance.now()
    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration)
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    // Safety snap: whatever happens to the animation, land on the target.
    const snap = setTimeout(() => setValue(target), duration + 150)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(snap)
    }
  }, [target, duration])
  return value
}

/** Animated numeral — renders the count-up inline. */
export function CountUp({ value }: { value: number }) {
  return <>{useCountUp(value)}</>
}
