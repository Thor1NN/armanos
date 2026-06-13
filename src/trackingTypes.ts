/**
 * Jedno źródło prawdy: typ pomiaru ćwiczenia → które metryki zbieramy.
 * Używane przez: formularz logowania (które inputy) i hook SetLog (czyszczenie pól spoza typu).
 */

export type MetricField = 'weight' | 'reps' | 'rir' | 'distanceM' | 'durationSec'
export type TrackingType = 'strength' | 'cardio'

export type UnitOption = { label: string; value: string; factor: number }
export type MetricMeta = {
  label: string
  placeholder: string
  numeric: boolean
  // Pole złożone: wejście min + sek, w bazie suma sekund
  composite?: 'duration'
  // Jednostki wejścia na froncie; w bazie wartość bazowa (factor = ile jednostek bazowych na 1 wybraną)
  units?: { default: string; options: UnitOption[] }
}

export const METRIC_FIELDS: Record<MetricField, MetricMeta> = {
  weight: { label: 'Ciężar (kg)', placeholder: 'ciężar', numeric: true },
  reps: { label: 'Powtórzenia', placeholder: 'powtórzenia', numeric: false },
  rir: { label: 'RIR', placeholder: 'RIR (rezerwa)', numeric: false },
  distanceM: { label: 'Dystans (m)', placeholder: 'dystans', numeric: true },
  durationSec: { label: 'Czas', placeholder: 'minuty / sekundy', numeric: true, composite: 'duration' },
}

export const ALL_METRIC_FIELDS = Object.keys(METRIC_FIELDS) as MetricField[]

export const TRACKING: Record<TrackingType, { label: string; fields: MetricField[] }> = {
  strength: { label: 'Siłowe', fields: ['weight', 'reps', 'rir'] },
  cardio: { label: 'Cardio', fields: ['distanceM', 'durationSec'] },
}

export const DEFAULT_TRACKING: TrackingType = 'strength'

/** Lista pól dla danego typu (z fallbackiem do domyślnego). */
export const trackingFields = (t?: string | null): MetricField[] =>
  t && t in TRACKING ? TRACKING[t as TrackingType].fields : TRACKING[DEFAULT_TRACKING].fields

/** Opcje selecta dla Payload. */
export const trackingOptions = (Object.keys(TRACKING) as TrackingType[]).map((value) => ({
  label: TRACKING[value].label,
  value,
}))
