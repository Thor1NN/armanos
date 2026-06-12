export const joinClasses = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ')

export const surfaceClass = 'rounded-xl border border-app-border bg-app-card'
export const panelClass = 'rounded-xl border border-app-border bg-app-panel'
export const mutedTextClass = 'text-app-muted'
export const sectionLabelClass = 'text-xs uppercase tracking-[0.04em] text-app-muted'
export const inputClass =
  'rounded-lg border border-app-border bg-app-bg px-3 py-2.5 text-sm text-app-text outline-none transition-[border-color,box-shadow] focus-visible:border-app-accent focus-visible:ring-2 focus-visible:ring-app-accent/20'
export const compactInputClass = joinClasses('w-[72px] px-2.5 py-2', inputClass)
export const compactUnitInputClass = joinClasses('w-16 px-2.5 py-2', inputClass)
export const selectClass = joinClasses('px-2 py-2', inputClass)
export const primaryButtonClass =
  'inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg bg-app-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-app-accent-hover disabled:cursor-not-allowed disabled:opacity-60'
export const secondaryButtonClass =
  'inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-app-border px-3 py-2 text-sm font-medium text-app-muted transition-[border-color,color,box-shadow] hover:border-app-muted hover:text-app-text focus-visible:border-app-accent focus-visible:ring-2 focus-visible:ring-app-accent/20 disabled:cursor-not-allowed disabled:opacity-60'
export const dashedButtonClass =
  'inline-flex min-h-8 cursor-pointer items-center justify-center rounded-lg border border-dashed border-app-border px-3 py-1.5 text-sm text-app-accent transition-colors hover:border-app-accent focus-visible:border-app-accent focus-visible:ring-2 focus-visible:ring-app-accent/20'
export const iconButtonClass =
  'cursor-pointer rounded px-1.5 py-0.5 text-sm text-app-muted transition-colors hover:text-app-accent focus-visible:text-app-accent'
export const dangerIconButtonClass =
  'cursor-pointer rounded px-1.5 py-0.5 text-sm text-app-muted transition-colors hover:text-app-danger focus-visible:text-app-danger'
export const errorBannerClass =
  'rounded-lg border border-[rgba(255,90,90,0.3)] bg-[rgba(255,90,90,0.12)] px-3 py-2.5 text-sm text-app-danger'

export const statusBadgeClass = (status: string) =>
  joinClasses(
    'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.03em]',
    status === 'active' && 'bg-[rgba(79,140,255,0.15)] text-app-accent',
    status === 'paused' && 'bg-[rgba(255,180,70,0.15)] text-app-warn',
    status === 'completed' && 'bg-[rgba(150,160,175,0.15)] text-app-muted',
  )
