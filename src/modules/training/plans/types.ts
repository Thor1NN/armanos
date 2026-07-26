import type {
  Exercise as PayloadExercise,
  Microcycle as PayloadMicrocycle,
  Plan as PayloadPlan,
  Workout as PayloadWorkout,
  WorkoutExerciseRow,
  WorkoutGroup,
} from '@/payload-types'

export type Exercise = Omit<WorkoutExerciseRow, 'exercise' | 'group'> & {
  exercise: PayloadExercise | null
  meta: string[]
}

export type Group = {
  protocol: NonNullable<WorkoutGroup['protocol']>
  label: string
  protocolLabel: string
  meta: string[]
  exercises: Exercise[]
}

// A block bundles consecutive groups that share one colored band in the tracker.
export type Block = {
  index: number
  groups: Group[]
}

type PayloadWorkoutSection = NonNullable<PayloadWorkout['sections']>[number]

export type Section = Pick<PayloadWorkoutSection, 'title' | 'subtitle'> & {
  blocks: Block[]
}

export type Workout = Pick<PayloadWorkout, 'id' | 'title' | 'rpe'> & {
  sections: Section[]
}

export type Microcycle = Pick<PayloadMicrocycle, 'id' | 'title' | 'rpe'> & {
  workouts: Workout[]
}

export type Plan = Pick<PayloadPlan, 'id' | 'title' | 'description'> & {
  status: NonNullable<PayloadPlan['status']>
  statusLabel: string
  dateRange?: string | null
  microcycles: Microcycle[]
}

export type LoadTrainingPlansOutput =
  | {
      user: { id: number | string; name?: string | null; email?: string | null }
      plans: Plan[]
    }
  | { user: null }

export type ExerciseMetaLabels = {
  seriesPrefix: string
  durationPrefix: string
  restPrefix: string
}

export type BuildExerciseMetaInput = Pick<
  WorkoutExerciseRow,
  | 'rounds'
  | 'reps'
  | 'repsLeft'
  | 'repsRight'
  | 'targetType'
  | 'durationMin'
  | 'durationSec'
  | 'rest'
  | 'tut'
  | 'rir'
  | 'kg'
>

export type BuildWorkoutGroupMetaInput = Pick<
  WorkoutGroup,
  | 'protocol'
  | 'rounds'
  | 'intervalSeconds'
  | 'workSeconds'
  | 'restSeconds'
  | 'restBetweenRounds'
>

export type FormatWorkoutGroupLabelInput = Pick<BuildWorkoutGroupMetaInput, 'protocol'>

export type WorkoutProtocol = NonNullable<WorkoutGroup['protocol']>
