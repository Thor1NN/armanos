import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config.js'

const pageSize = 100

const isMissing = (value: string | null | undefined): boolean => value == null

async function run() {
  const payload = await getPayload({ config })
  let page = 1
  let processedCount = 0
  let updatedCount = 0

  payload.logger.info('Starting workout exercise reps backfill.')

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
      const hasLegacyReps = !isMissing(exerciseRow.reps)
      const hasNoSideReps = isMissing(exerciseRow.repsLeft) && isMissing(exerciseRow.repsRight)

      if (!hasLegacyReps || !hasNoSideReps) continue

      await payload.update({
        collection: 'workout-exercise-rows',
        id: exerciseRow.id,
        depth: 0,
        overrideAccess: true,
        data: {
          repsLeft: exerciseRow.reps,
          repsRight: exerciseRow.reps,
        },
      })
      updatedCount += 1
    }

    processedCount += result.docs.length
    payload.logger.info(`Processed ${processedCount} of ${result.totalDocs} workout exercise rows. Updated ${updatedCount}.`)

    if (!result.hasNextPage) break
    page += 1
  }

  payload.logger.info(`Backfilled ${updatedCount} workout exercise rows.`)
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
