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
  const parts: string[] = []

  if (hasMetricValue(exercise.rounds)) {
    parts.push(`${labels.seriesPrefix}: ${exercise.rounds}`)
  }

  if (exercise.targetType === 'duration') {
    const duration = formatMinSec(exercise.durationMin, exercise.durationSec)
    if (duration) parts.push(`${labels.durationPrefix}: ${duration}`)
  } else {
    const sideReps = formatSideReps(exercise.repsLeft, exercise.repsRight)
    if (sideReps) parts.push(`Steps: ${sideReps}`)
    else if (hasMetricValue(exercise.reps)) parts.push(`Steps: ${exercise.reps}`)
  }

  if (hasMetricValue(exercise.rest)) parts.push(`${labels.restPrefix}: ${exercise.rest}`)
  if (hasMetricValue(exercise.tut)) parts.push(`TUT: ${exercise.tut}`)
  if (hasMetricValue(exercise.rir)) parts.push(`RIR: ${exercise.rir}`)
  if (hasMetricValue(exercise.kg)) parts.push(`KG: ${exercise.kg}`)

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
