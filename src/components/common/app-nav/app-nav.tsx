'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React from 'react'
import { Dumbbell, History, TrendingUp } from 'lucide-react'
import { joinClasses } from '@/lib/class-names'

const NAV_ITEMS = [
  { href: '/', key: 'today', icon: Dumbbell, exact: true },
  { href: '/history', key: 'history', icon: History, exact: false },
  { href: '/progress', key: 'progress', icon: TrendingUp, exact: false },
] as const

/** Mobile-first bottom navigation for the client app. */
export function AppNav() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  // Strip the locale prefix ("/en/history" → "/history") for matching.
  const path = pathname.replace(/^\/(pl|en)(?=\/|$)/, '') || '/'

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ui-border-base bg-ui-bg-component pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-135 items-stretch justify-around">
        {NAV_ITEMS.map(({ href, key, icon: Icon, exact }) => {
          const active = exact ? path === href : path.startsWith(href)
          return (
            <Link
              key={key}
              href={href}
              className={joinClasses(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
                active ? 'text-ui-fg-interactive' : 'text-ui-fg-muted',
              )}
            >
              <Icon size={18} />
              {t(key)}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
