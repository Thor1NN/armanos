export const hasMetricValue = (value?: string | null): boolean => {
  const trimmed = value?.trim() ?? ''
  return trimmed !== '' && trimmed.toLowerCase() !== 'x'
}

export const formatSideReps = (
  repsLeft?: string | null,
  repsRight?: string | null,
): string | null => {
  const left = hasMetricValue(repsLeft) ? repsLeft?.trim() || null : null
  const right = hasMetricValue(repsRight) ? repsRight?.trim() || null : null

  if (left && right) return `${left}+${right}`
  return left ?? right
}
