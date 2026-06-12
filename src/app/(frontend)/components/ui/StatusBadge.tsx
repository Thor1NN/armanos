import React from 'react'
import { statusBadgeClass } from '../../ui'

export function StatusBadge({ children, status }: { children: React.ReactNode; status: string }) {
  return <span className={statusBadgeClass(status)}>{children}</span>
}
