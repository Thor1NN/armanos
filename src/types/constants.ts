export const STATUS_LABEL: Record<string, string> = {
  active: 'Aktywny',
  paused: 'Wstrzymany',
  completed: 'Zakończony',
}

export type Protocol = 'emom' | 'amrap' | 'for_time' | 'tabata'

export const PROTOCOL_LABEL: Record<Protocol, string> = {
  emom: 'EMOM',
  amrap: 'AMRAP',
  for_time: 'For Time',
  tabata: 'Tabata',
}

export const STORAGE_KEY = 'training-app:active-workout-selection'
export const SSR_SNAPSHOT = '__SSR_SELECTION__'
