import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config.js'

const pageSize = 100
const kgAmountPattern = '\\d+(?:[.,]\\d+)?(?:\\s*kg\\.?)?'
const kgOptionPattern = `${kgAmountPattern}(?:\\s*[+-]\\s*${kgAmountPattern})*`
const kgValuePattern = new RegExp(`^\\s*${kgOptionPattern}(?:\\s+lub\\s+${kgOptionPattern})*\\s*$`, 'i')

const normalizeKgValue = (value: string | null | undefined): string | null => {
  if (!value || !kgValuePattern.test(value)) return null
  return value
    .replace(/\s*kg\.?\s*/gi, '')
    .replace(/\s*([+-])\s*/g, (_matchedDelimiter, delimiter) => delimiter)
    .replace(/\s*lub\s*/gi, ' lub ')
    .trim()
}

async function run() {
  const payload = await getPayload({ config })
  let page = 1
  let processedCount = 0
  let updatedCount = 0

  payload.logger.info('Starting workout exercise KG normalization.')

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
      const normalizedKg = normalizeKgValue(exerciseRow.kg)
      if (!normalizedKg || normalizedKg === exerciseRow.kg) continue

      await payload.update({
        collection: 'workout-exercise-rows',
        id: exerciseRow.id,
        depth: 0,
        overrideAccess: true,
        data: { kg: normalizedKg },
      })
      updatedCount += 1
    }

    processedCount += result.docs.length
    payload.logger.info(`Processed ${processedCount} of ${result.totalDocs} workout exercise rows. Updated ${updatedCount}.`)

    if (!result.hasNextPage) break
    page += 1
  }

  payload.logger.info(`Normalized ${updatedCount} workout exercise rows.`)
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
