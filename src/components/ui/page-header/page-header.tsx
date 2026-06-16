import React from 'react'
import { joinClasses } from '@/lib/class-names'
import { Logo } from '@/components/ui/logo'

type PageHeaderProps = {
  title: string
  subtitle?: string
  /** Content rendered on the opposite side of the title (e.g. an action button or a meta label). */
  right?: React.ReactNode
  /** `inline` puts the logo next to the title, `stacked` puts it above. */
  layout?: 'inline' | 'stacked'
  className?: string
}

const logoClass = 'h-7 w-auto sm:h-8'

export function PageHeader({ title, subtitle, right, layout = 'inline', className }: PageHeaderProps) {
  const subtitleNode = subtitle && (
    <span className="mt-0.5 block text-xs text-ui-fg-muted sm:mt-1">{subtitle}</span>
  )

  if (layout === 'stacked') {
    return (
      <div className={joinClasses('flex items-start justify-between gap-4', className)}>
        <div>
          <Logo className={joinClasses('mb-3', logoClass)} />
          <h1 className="text-lg font-semibold text-ui-fg-base sm:text-xl">{title}</h1>
          {subtitleNode}
        </div>
        {right}
      </div>
    )
  }

  return (
    <div className={joinClasses('flex items-center justify-between gap-3 sm:gap-4', className)}>
      <div className="flex items-center gap-3">
        <Logo className={logoClass} />
        <div>
          <h1 className="text-sm font-semibold text-ui-fg-base sm:text-xl">{title}</h1>
          {subtitleNode}
        </div>
      </div>
      {right}
    </div>
  )
}
