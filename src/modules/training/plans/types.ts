import type {
  Exercise as PayloadExercise,
  Microcycle as PayloadMicrocycle,
  Plan as PayloadPlan,
  Workout as PayloadWorkout,
  WorkoutExerciseRow,
  WorkoutGroup,
} from '@/payload-types'

export type PlanDocuments = {
  plans: PayloadPlan[]
  microcycles: PayloadMicrocycle[]
  workouts: PayloadWorkout[]
  groups: WorkoutGroup[]
  exerciseRows: WorkoutExerciseRow[]
}

export type WorkoutExerciseTree = WorkoutExerciseRow & {
  group: WorkoutGroup['id']
  exercise: PayloadExercise | null
  meta: string[]
}

export type WorkoutGroupTree = WorkoutGroup & {
  protocol: NonNullable<WorkoutGroup['protocol']>
  label: string
  protocolLabel: string
  meta: string[]
  exercises: WorkoutExerciseTree[]
}

// A block bundles consecutive groups that share one colored band in the tracker.
export type WorkoutBlock = {
  index: number
  groups: WorkoutGroupTree[]
}

type PayloadWorkoutSection = NonNullable<PayloadWorkout['sections']>[number]

export type WorkoutSectionTree = PayloadWorkoutSection & {
  blocks: WorkoutBlock[]
}

export type WorkoutTree = Omit<PayloadWorkout, 'sections'> & {
  sections: WorkoutSectionTree[]
}

export type MicrocycleTree = PayloadMicrocycle & {
  workouts: WorkoutTree[]
}

export type PlanTree = PayloadPlan & {
  status: NonNullable<PayloadPlan['status']>
  statusLabel: string
  dateRange: string | null
  microcycles: MicrocycleTree[]
}

export type LoadTrainingPlansOutput =
  | {
      user: {
        id: number | string
        name?: string | null
        email?: string | null
        dailyKcalTarget?: number | null
      }
      plans: PlanTree[]
    }
  | { user: null }

export type ExerciseMetaLabels = {
  seriesPrefix: string
  durationPrefix: string
  restPrefix: string
  statusActive: string
  statusPaused: string
  statusCompleted: string
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
