/**
 * Seeds the food catalog from src/data/foods-seed.json.
 * Idempotent: matches by name, never overwrites coach edits.
 * Run: yarn seed:foods (uses DATABASE_URL from the environment / .env)
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import config from '../payload.config.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const INPUT = path.resolve(dirname, '../data/foods-seed.json')

type SeedFood = {
  name: string
  kcalPer100g: number
  proteinPer100g?: number
  carbsPer100g?: number
  fatPer100g?: number
}

async function run() {
  const foods = JSON.parse(fs.readFileSync(INPUT, 'utf8')) as SeedFood[]
  const payload = await getPayload({ config })

  let created = 0
  let skipped = 0
  for (const food of foods) {
    const existing = await payload.find({
      collection: 'foods',
      where: { name: { equals: food.name } },
      limit: 1,
      depth: 0,
    })
    if (existing.docs.length) {
      skipped += 1
      continue
    }
    await payload.create({ collection: 'foods', data: food })
    created += 1
  }
  console.log(`foods seed: ${created} created, ${skipped} already present`)
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
