import { formatSideReps, hasMetricValue } from '@/modules/training/exercises'
import { formatMinSec } from '@/lib/date'
import { PROTOCOL_LABEL } from './constants'
import type {
  BuildExerciseMetaInput,
  BuildWorkoutGroupMetaInput,
  ExerciseMetaLabels,
  FormatWorkoutGroupLabelInput,
  WorkoutExerciseTree,
} from './types'

export const getExerciseName = (
  exercise: Pick<WorkoutExerciseTree, 'exercise' | 'note'>,
): string => exercise.exercise?.name ?? exercise.note ?? ''

export const buildExerciseMeta = (
  exercise: BuildExerciseMetaInput,
  labels: ExerciseMetaLabels,
): string[] => {
  // Compact, app-like prescription line: "3 × 8 · 60 kg · RIR 2 · rest 90s"
  const parts: string[] = []

  const target =
    exercise.targetType === 'duration'
      ? formatMinSec(exercise.durationMin, exercise.durationSec)
      : (formatSideReps(exercise.repsLeft, exercise.repsRight) ??
        (hasMetricValue(exercise.reps) ? exercise.reps : null))

  if (hasMetricValue(exercise.rounds) && target) {
    parts.push(`${exercise.rounds} × ${target}`)
  } else if (hasMetricValue(exercise.rounds)) {
    parts.push(`${exercise.rounds} ${labels.seriesPrefix.toLowerCase()}`)
  } else if (target) {
    parts.push(String(target))
  }

  if (hasMetricValue(exercise.kg)) parts.push(`${exercise.kg} kg`)
  if (hasMetricValue(exercise.rir)) parts.push(`RIR ${exercise.rir}`)
  if (hasMetricValue(exercise.tut)) parts.push(`TUT ${exercise.tut}`)
  if (hasMetricValue(exercise.rest)) parts.push(`${labels.restPrefix.toLowerCase()} ${exercise.rest}s`)

  return parts
}

export const formatWorkoutGroupLabel = (group: FormatWorkoutGroupLabelInput): string => {
  const protocol = group.protocol
  return protocol && protocol !== 'standard' ? PROTOCOL_LABEL[protocol] : ''
}

export const buildWorkoutGroupMeta = (group: BuildWorkoutGroupMetaInput): string[] => {
  const restValue = group.restBetweenRounds?.trim() ?? ''
  const rest = hasMetricValue(restValue)
    ? /^\d+(?:\.\d+)?$/.test(restValue)
      ? `Rest: ${restValue} s`
      : `Rest: ${restValue}`
    : null

  const parts: string[] = []

  if (group.protocol === 'standard') {
    if (group.rounds) parts.push(`Sets: ${group.rounds}`)
    if (rest) parts.push(rest)
    return parts
  }

  if (group.protocol === 'emom') {
    if (group.rounds) parts.push(`Duration: ${group.rounds} min`)
    if (group.intervalSeconds != null) parts.push(`Interval: ${group.intervalSeconds} s`)
    return parts
  }

  if (group.protocol === 'tabata') {
    if (group.workSeconds != null) parts.push(`Work: ${group.workSeconds} s`)
    if (group.restSeconds != null) parts.push(`Rest: ${group.restSeconds} s`)
  }

  return parts
}
