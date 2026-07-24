import type { TextFieldValidation } from 'payload'

type SiblingData = Record<string, unknown>

const hasValue = (value: unknown): boolean =>
  value !== null && value !== undefined && String(value).trim() !== ''

export const validateRounds: TextFieldValidation = (value) => {
  if (value && !/^[\d\-–]+$/.test(String(value))) return 'Format: number or range (e.g. 4, 3–4)'
  return true
}

export const validateRepsSidesOrKg: TextFieldValidation = (value, { siblingData }) => {
  const data = siblingData as SiblingData
  if (!hasValue(value) && !hasValue(data.repsLeft) && !hasValue(data.repsRight) && !hasValue(data.kg)) return 'Enter reps or load'
  return true
}

export const validateKgOrRepsSides: TextFieldValidation = (value, { siblingData }) => {
  const data = siblingData as SiblingData
  if (!hasValue(value) && !hasValue(data.repsLeft) && !hasValue(data.repsRight)) return 'Enter reps or load'
  return true
}

export const validateDuration: TextFieldValidation = (value, { siblingData }) => {
  const data = siblingData as SiblingData
  if (!hasValue(value) && !hasValue(data.durationMin) && !hasValue(data.durationSec)) return 'Enter duration'
  return true
}

export const validateDurationMinutes: TextFieldValidation = (value, { siblingData }) => {
  if ((siblingData as SiblingData)?.protocol === 'amrap' && (!value || isNaN(Number(value))))
    return 'Enter duration (minutes)'
  return true
}

export const validateIntervalSeconds: TextFieldValidation = (value, { siblingData }) => {
  if ((siblingData as SiblingData)?.protocol === 'emom' && (!value || isNaN(Number(value))))
    return 'Enter interval (seconds)'
  return true
}

export const validateWorkSeconds: TextFieldValidation = (value, { siblingData }) => {
  if ((siblingData as SiblingData)?.protocol === 'tabata' && (!value || isNaN(Number(value))))
    return 'Enter work duration'
  return true
}

export const validateRestSeconds: TextFieldValidation = (value, { siblingData }) => {
  if ((siblingData as SiblingData)?.protocol === 'tabata' && (!value || isNaN(Number(value))))
    return 'Enter rest duration'
  return true
}
