export type TExercise = {
  rowId: string
  numer?: string | null
  name: string
  note?: string | null
  exerciseId?: number | null
  exerciseName: string
  trackingType?: string | null
  videoUrl?: string | null
  rounds?: string | null
  meta: string[]
  prefill: { repsLeft?: string | null; repsRight?: string | null }
  setParameters?: Array<{ setNumber: number; reps?: string | null; kg?: string | null }> | null
}

export type TGroup = {
  protocol: string
  label: string
  protocolLabel: string
  exercises: TExercise[]
}

// A block bundles consecutive groups that share one colored band in the tracker.
export type TBlock = { index: number; groups: TGroup[] }

export type TSection = { title?: string | null; subtitle?: string | null; blocks: TBlock[] }
export type TWorkout = { id: number; title: string; rpe?: number | null; sections: TSection[] }

export type Session = { id: number; startedAt?: string | null; finishedAt?: string | null; notes?: string | null }

export type SetLog = {
  id: number
  exerciseRow?: number | null
  setNumber?: number | null
  weight?: number | null
  weightLeft?: number | null
  weightRight?: number | null
  isBodyweight?: boolean | null
  distanceM?: number | null
  durationSec?: number | null
  reps?: string | null
  repsLeft?: string | null
  repsRight?: string | null
  rir?: string | null
  note?: string | null
}

export type Values = Record<string, string>
