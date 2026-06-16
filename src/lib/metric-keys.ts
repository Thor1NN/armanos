/**
 * Composite form-field key helpers. The form flattens compound metrics into
 * separate keys (e.g. duration -> `field__min` + `field__sec`), so the same
 * naming must be used when writing form values and reading them back. Keeping
 * the convention here prevents the write and read sides from drifting apart.
 */

export const BODYWEIGHT_KEY = 'weight__bodyweight'

export const minKey = (field: string): string => `${field}__min`
export const secKey = (field: string): string => `${field}__sec`
export const unitKey = (field: string): string => `${field}__unit`
