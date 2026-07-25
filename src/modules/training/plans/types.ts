export type WorkoutProtocol = 'standard' | 'emom' | 'amrap' | 'for_time' | 'tabata'

export type TExercise = {
  rowId: string
  numer?: string | null
  name: string
  note?: string | null
  exerciseId?: number | null
  exerciseName: string
  trackingType?: string | null
  targetType?: 'repetitions' | 'duration' | null
  videoUrl?: string | null
  rounds?: string | null
  meta: string[]
  prefill: { repsLeft?: string | null; repsRight?: string | null }
  setParameters?: Array<{ setNumber: number; reps?: string | null; kg?: string | null }> | null
}

export type TGroup = {
  protocol: WorkoutProtocol
  label: string
  protocolLabel: string
  meta: string[]
  exercises: TExercise[]
}

// A block bundles consecutive groups that share one colored band in the tracker.
export type TBlock = {
  index: number
  groups: TGroup[]
}

export type TSection = {
  title?: string | null
  subtitle?: string | null
  blocks: TBlock[]
}

export type TWorkout = {
  id: number
  title: string
  rpe?: number | null
  sections: TSection[]
}

export type TPlanAccordionItem = {
  id: number | string
  title: string
  status: string
  statusLabel: string
  dateRange?: string | null
  description?: string | null
  microcycles: Array<{
    id: number | string
    title: string
    rpe?: number | null
    workouts: TWorkout[]
  }>
}

export type PlanLabels = {
  seriesPrefix: string
  durationPrefix: string
  restPrefix: string
}

export type TrainingPlansLoadResult =
  | {
      user: { id: number | string; name?: string | null; email?: string | null }
      plans: TPlanAccordionItem[]
    }
  | { user: null }

export type ExerciseMetaLabels = {
  seriesPrefix: string
  durationPrefix: string
  restPrefix: string
}

export type ExerciseMetaSource = {
  rounds?: string | null
  reps?: string | null
  repsLeft?: string | null
  repsRight?: string | null
  targetType?: 'repetitions' | 'duration' | null
  durationMin?: number | null
  durationSec?: number | null
  rest?: string | null
  tut?: string | null
  rir?: string | null
  kg?: string | null
}

export type WorkoutGroupMetaSource = {
  protocol?: WorkoutProtocol | null
  rounds?: string | null
  intervalSeconds?: number | null
  workSeconds?: number | null
  restSeconds?: number | null
  restBetweenRounds?: string | null
}

export type WorkoutGroupLabelSource = Pick<WorkoutGroupMetaSource, 'protocol'>
