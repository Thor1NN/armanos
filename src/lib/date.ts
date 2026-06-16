export const pad2 = (value: string | number) => String(value).padStart(2, '0')

/** Uses local timezone - the same instant may map to a different day across zones. */
export const isoToDateInput = (iso?: string | null): string => {
  if (!iso) return ''
  const date = new Date(iso)
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

/** Uses local timezone - the same instant may map to a different time across zones. */
export const isoToTimeInput = (iso?: string | null): string => {
  if (!iso) return ''
  const date = new Date(iso)
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

/** Combines date and time inputs into an ISO string. Inputs are read as local time. */
export const combineDateTime = (date: string, time: string): string | null => {
  if (!date && !time) return null
  const datePart = date || isoToDateInput(new Date().toISOString())
  const timePart = time || '00:00'
  const result = new Date(`${datePart}T${timePart}`)
  return Number.isNaN(result.getTime()) ? null : result.toISOString()
}

export const formatDuration = (start?: string | null, end?: string | null): string | null => {
  if (!start || !end) return null
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 0) return null
  const totalMin = Math.round(ms / 60000)
  if (!totalMin) return null
  const hours = Math.floor(totalMin / 60)
  const minutes = totalMin % 60
  return hours ? `${hours}h ${minutes}min` : `${minutes}min`
}

export const formatMinSec = (min?: number | null, sec?: number | null): string | null => {
  const minutes = min ?? 0
  const seconds = sec ?? 0
  if (!minutes && !seconds) return null
  const parts: string[] = []
  if (minutes) parts.push(`${minutes} min`)
  if (seconds) parts.push(`${seconds} s`)
  return parts.join(' ')
}

export const formatSec = (s: number): string => {
  if (s < 60) return `${s} s`
  const minutes = Math.floor(s / 60)
  const rest = s % 60
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`
}

/** Parse a free-form mm:ss / mmss / ss string into separate minute and second parts. */
export const parseMmSs = (raw: string): { min: string; sec: string } => {
  const clean = raw.replace(/[^\d:]/g, '')
  if (clean.includes(':')) {
    const [min, sec] = clean.split(':')
    return { min: min ?? '', sec: sec ?? '' }
  }
  if (clean.length <= 2) return { min: clean, sec: '' }
  return { min: clean.slice(0, -2), sec: clean.slice(-2) }
}

/** Format minute and second parts into a zero-padded mm:ss string (empty when both blank). */
export const formatMmSs = (min: string, sec: string): string => {
  if (!min && !sec) return ''
  return `${pad2(min || '0')}:${pad2(sec || '0')}`
}
