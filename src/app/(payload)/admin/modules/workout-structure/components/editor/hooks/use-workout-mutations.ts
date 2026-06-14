'use client'

import { useState } from 'react'
import { toast } from '@payloadcms/ui'
import { sdk } from '@/lib/sdk'
import type { ExerciseRow, Group } from '../../../types'

export function useWorkoutMutations(
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>,
  setExerciseRows: React.Dispatch<React.SetStateAction<ExerciseRow[]>>,
) {
  const [deletingGroup, setDeletingGroup] = useState<number | null>(null)
  const [deletingExercise, setDeletingExercise] = useState<number | null>(null)

  const deleteGroup = async (groupId: number) => {
    setDeletingGroup(groupId)
    try {
      await sdk.delete({ collection: 'workout-groups', id: groupId })
      setGroups((prev) => prev.filter((g) => g.id !== groupId))
      setExerciseRows((prev) => prev.filter((r) => r.group !== groupId))
      toast.success('Grupa usunięta')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Nie można usunąć grupy')
    } finally {
      setDeletingGroup(null)
    }
  }

  const deleteExercise = async (rowId: number) => {
    setDeletingExercise(rowId)
    try {
      await sdk.delete({ collection: 'workout-exercise-rows', id: rowId })
      setExerciseRows((prev) => prev.filter((r) => r.id !== rowId))
      toast.success('Ćwiczenie usunięte')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Nie można usunąć ćwiczenia')
    } finally {
      setDeletingExercise(null)
    }
  }

  return { deleteGroup, deleteExercise, deletingGroup, deletingExercise }
}
