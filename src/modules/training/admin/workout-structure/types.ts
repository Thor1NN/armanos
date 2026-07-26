import type {
  Exercise as PayloadExercise,
  Workout,
  WorkoutExerciseRow,
  WorkoutGroup,
} from '@/payload-types'

export type Section = NonNullable<Workout['sections']>[number]

export type ExerciseRow = Omit<WorkoutExerciseRow, 'group' | 'exercise'> & {
  group: number
  exercise?: Pick<PayloadExercise, 'id' | 'name'> | null
}

export type LoadWorkoutStructureOutput = {
  sections: Section[]
  initialGroups: WorkoutGroup[]
  initialExerciseRows: ExerciseRow[]
  groupIdsWithLogs: number[]
  exerciseRowIdsWithLogs: number[]
}
