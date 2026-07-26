import { DEFAULT_TRACKING, TRACKING } from './constants'
import type { MetricField, TrackingType } from './types'

export const getTrackingFields = (trackingType?: string | null): MetricField[] =>
  trackingType && trackingType in TRACKING
    ? TRACKING[trackingType as TrackingType].fields
    : TRACKING[DEFAULT_TRACKING].fields
