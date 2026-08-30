'use client'

import React from 'react'

const COLORS = {
  blue: 'var(--color-stat-blue)',
  green: 'var(--color-stat-green)',
  red: 'var(--color-stat-red)',
  amber: 'var(--color-stat-amber)',
} as const

export type StatRingColor = keyof typeof COLORS

/**
 * Dashboard-style circular gauge: a glowing progress ring with arbitrary
 * center content. `value` is 0–100.
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
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dash = (clamped / 100) * circumference
  const stroke = COLORS[color]

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-ui-border-base"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={stroke}
          strokeDasharray={`${dash} ${circumference - dash}`}
          style={{
            filter: `drop-shadow(0 0 ${strokeWidth}px color-mix(in srgb, ${stroke} 55%, transparent))`,
            transition: 'stroke-dasharray 600ms ease',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  )
}
