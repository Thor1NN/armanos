import { METRIC_FIELDS, type MetricField } from '../../../../trackingTypes'
import type { SetLog, Values } from './types'

export const pad2 = (n: number) => String(n).padStart(2, '0')

export const isoToDateInput = (iso?: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export const isoToTimeInput = (iso?: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export const combineDateTime = (date: string, time: string): string | null => {
  if (!date && !time) return null
  const d = date || isoToDateInput(new Date().toISOString())
  const t = time || '00:00'
  return new Date(`${d}T${t}`).toISOString()
}

export const fmtDuration = (start?: string | null, end?: string | null): string | null => {
  if (!start || !end) return null
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 0) return null
  const totalMin = Math.round(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h ? `${h} h ${m} min` : `${m} min`
}

export const metricBody = (fields: MetricField[], v: Values): Record<string, unknown> => {
  const body: Record<string, unknown> = {}

  for (const f of fields) {
    const meta = METRIC_FIELDS[f]
    if (meta.composite === 'duration') {
      const mins = (v[`${f}__min`] ?? '').trim()
      const secs = (v[`${f}__sec`] ?? '').trim()
      body[f] = mins === '' && secs === '' ? null : (Number(mins) || 0) * 60 + (Number(secs) || 0)
      continue
    }

    const raw = (v[f] ?? '').trim()
    if (raw === '') {
      body[f] = null
    } else if (meta.units) {
      const unit = v[`${f}__unit`] || meta.units.default
      const factor = meta.units.options.find((o) => o.value === unit)?.factor ?? 1
      body[f] = Number(raw) * factor
    } else {
      body[f] = meta.numeric ? Number(raw) : raw
    }
  }

  body.note = v.note?.trim() || null
  return body
}

export const toDefaultUnit = (f: MetricField, base: number): { value: string; unit: string } => {
  const meta = METRIC_FIELDS[f]
  if (!meta.units) return { value: String(base), unit: '' }
  const unit = meta.units.default
  const factor = meta.units.options.find((o) => o.value === unit)?.factor ?? 1
  return { value: String(base / factor), unit }
}

export const fmtSec = (s: number): string => {
  if (s < 60) return `${s} s`
  const m = Math.floor(s / 60)
  const rest = s % 60
  return rest ? `${m} min ${rest} s` : `${m} min`
}

export const setSummary = (s: SetLog): string => {
  const parts: string[] = []
  if (s.weight != null) parts.push(`${s.weight} kg`)
  if (s.distanceM != null) parts.push(`${s.distanceM} m`)
  if (s.durationSec != null) parts.push(fmtSec(s.durationSec))
  if (s.reps) parts.push(`× ${s.reps}`)
  if (s.rir) parts.push(`RIR ${s.rir}`)
  if (s.note) parts.push(s.note)
  return parts.length ? parts.join(' · ') : '—'
}
