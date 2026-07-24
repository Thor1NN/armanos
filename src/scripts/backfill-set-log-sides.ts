import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config.js'

const pageSize = 100

const isMissing = (value: number | string | null | undefined): boolean => value == null

async function run() {
  const payload = await getPayload({ config })
  let page = 1
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
      const hasLegacyValues = !isMissing(setLog.weight) || !isMissing(setLog.reps)
      const hasNoSideValues = [setLog.weightLeft, setLog.weightRight, setLog.repsLeft, setLog.repsRight].every(isMissing)

      if (!hasLegacyValues || !hasNoSideValues) continue

      await payload.update({
        collection: 'set-logs',
        id: setLog.id,
        depth: 0,
        overrideAccess: true,
        data: {
          weightLeft: setLog.weight,
          weightRight: setLog.weight,
          repsLeft: setLog.reps,
          repsRight: setLog.reps,
        },
      })
      updatedCount += 1
    }

    if (!result.hasNextPage) break
    page += 1
  }

  payload.logger.info(`Backfilled ${updatedCount} set logs.`)
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
