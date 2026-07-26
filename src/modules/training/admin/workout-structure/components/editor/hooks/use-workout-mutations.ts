'use client'

import { useState } from 'react'
import { toast } from '@payloadcms/ui'
import { sdk } from '@/lib/sdk'
import type { WorkoutGroup } from '@/payload-types'
import type { ExerciseRow } from '../../../types'

export function useWorkoutMutations(
  setGroups: React.Dispatch<React.SetStateAction<WorkoutGroup[]>>,
  setExerciseRows: React.Dispatch<React.SetStateAction<ExerciseRow[]>>,
) {
  const [deletingGroup, setDeletingGroup] = useState<number | null>(null)
  const [deletingExercise, setDeletingExercise] = useState<number | null>(null)

  const deleteGroup = async (groupId: number) => {
    setDeletingGroup(groupId)
    try {
      await sdk.delete({ collection: 'workout-groups', id: groupId })
      setGroups((previousGroups) => previousGroups.filter((group) => group.id !== groupId))
      setExerciseRows((previousRows) =>
        previousRows.filter((exerciseRow) => exerciseRow.group !== groupId),
      )
      toast.success('Group deleted')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete group')
    } finally {
      setDeletingGroup(null)
    }
  }

  const deleteExercise = async (rowId: number) => {
    setDeletingExercise(rowId)
    try {
      await sdk.delete({ collection: 'workout-exercise-rows', id: rowId })
      setExerciseRows((previousRows) =>
        previousRows.filter((exerciseRow) => exerciseRow.id !== rowId),
      )
      toast.success('Exercise deleted')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete exercise')
    } finally {
      setDeletingExercise(null)
    }
  }

  return { deleteGroup, deleteExercise, deletingGroup, deletingExercise }
}
