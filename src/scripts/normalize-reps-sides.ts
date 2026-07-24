import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config.js'

const pageSize = 100
const sideRepsPattern = /^\s*(\d+(?:[.,]\d+)?)\s*\+\s*(\d+(?:[.,]\d+)?)(?:\s*pow\.?)?\s*$/i

const splitSideReps = (repsLeft: string | null | undefined, repsRight: string | null | undefined) => {
  if (!repsLeft || repsLeft !== repsRight) return null

  const match = repsLeft.match(sideRepsPattern)
  if (!match) return null

  return { repsLeft: match[1], repsRight: match[2] }
}

async function normalizeSetLogs() {
  const payload = await getPayload({ config })
  let page = 1
  let processedCount = 0
  let updatedCount = 0

  while (true) {
    const result = await payload.find({
      collection: 'set-logs',
      depth: 0,
      limit: pageSize,
      page,
      sort: 'id',
      overrideAccess: true,
    })

    for (const setLog of result.docs) {
      const normalizedReps = splitSideReps(setLog.repsLeft, setLog.repsRight)
      if (!normalizedReps) continue

      await payload.update({
        collection: 'set-logs',
        id: setLog.id,
        depth: 0,
        overrideAccess: true,
        data: normalizedReps,
      })
      updatedCount += 1
    }

    processedCount += result.docs.length
    payload.logger.info(`Processed ${processedCount} of ${result.totalDocs} set logs. Updated ${updatedCount}.`)

    if (!result.hasNextPage) break
    page += 1
  }

  return updatedCount
}

async function normalizeWorkoutExerciseRows() {
  const payload = await getPayload({ config })
  let page = 1
  let processedCount = 0
  let updatedCount = 0

  while (true) {
    const result = await payload.find({
      collection: 'workout-exercise-rows',
      depth: 0,
      limit: pageSize,
      page,
      sort: 'id',
      overrideAccess: true,
    })

    for (const exerciseRow of result.docs) {
      const normalizedReps = splitSideReps(exerciseRow.repsLeft, exerciseRow.repsRight)
      if (!normalizedReps) continue

      await payload.update({
        collection: 'workout-exercise-rows',
        id: exerciseRow.id,
        depth: 0,
        overrideAccess: true,
        data: normalizedReps,
      })
      updatedCount += 1
    }

    processedCount += result.docs.length
    payload.logger.info(`Processed ${processedCount} of ${result.totalDocs} workout exercise rows. Updated ${updatedCount}.`)

    if (!result.hasNextPage) break
    page += 1
  }

  return updatedCount
}

async function run() {
  const payload = await getPayload({ config })
  payload.logger.info('Starting left and right reps normalization.')

  const normalizedSetLogs = await normalizeSetLogs()
  const normalizedExerciseRows = await normalizeWorkoutExerciseRows()

  payload.logger.info(`Normalized ${normalizedSetLogs} set logs and ${normalizedExerciseRows} workout exercise rows.`)
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
