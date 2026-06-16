import React from 'react'
import { joinClasses } from '@/lib/class-names'

export function PageContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={joinClasses('mx-auto max-w-3xl px-5 py-6 sm:px-6 sm:py-8', className)}>{children}</div>
}
