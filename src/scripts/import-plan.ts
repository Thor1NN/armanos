import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import config from '../payload.config.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA = path.resolve(dirname, '../data/plan-structured.json')

type RawExercise = Record<string, string | string[]>
type RawGroup = { setType: string | null; columns: string[] | null; exercises: RawExercise[] }
type RawSection = { title: string | null; subtitle: string | null; groups: RawGroup[] }
type RawWorkout = { name: string; rpe: number | null; sections: RawSection[] }
type RawMicro = { name: string; rpe: number | null; workouts: RawWorkout[] }
type RawPlan = { plan: string; microcycles: RawMicro[] }

const known = new Set([
  'Numer',
  'Ćwiczenie',
  'Serie',
  'Powtórzenia',
  'Przerwa',
  'Przerwa (sekundy)',
  'TUT',
  'RIR',
  'KG',
])

const str = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? v.join(' ') : (v ?? '')

/**
 * Z surowej nazwy odcina KOŃCOWY nawias zawierający "kg" (zakres ciężaru),
 * przenosząc go do pola kg. Reszta (warianty, wskazówki) zostaje w nazwie.
 * np. "Tureckie wstawanie ( 16-20kg)" → base "Tureckie wstawanie", kg "16-20kg"
 */
function normalizeName(raw: string): { base: string; kg?: string } {
  let name = raw.replace(/\s+/g, ' ').trim()
  let kg: string | undefined
  const m = name.match(/\(([^()]*)\)\s*$/)
  if (m && /kg/i.test(m[1])) {
    kg = m[1].replace(/około/gi, '').trim()
    name = name.slice(0, m.index).trim()
  }
  return { base: name, kg }
}

function buildExtra(ex: RawExercise): string {
  const extra: string[] = []
  for (const [k, v] of Object.entries(ex)) {
    if (known.has(k)) continue
    const val = Array.isArray(v) ? v.join(' | ') : v
    if (val) extra.push(k.startsWith('_') ? val : `${k}: ${val}`)
  }
  return extra.join(' | ')
}

const run = async () => {
  const payload = await getPayload({ config })
  const data: RawPlan = JSON.parse(fs.readFileSync(DATA, 'utf-8'))

  // --- Katalog ćwiczeń: upsert po nazwie (cache na czas importu) ---
  const exerciseCache = new Map<string, number>()
  let createdExercises = 0
  const ensureExercise = async (base: string): Promise<number | undefined> => {
    if (!base) return undefined
    const key = base.toLowerCase()
    if (exerciseCache.has(key)) return exerciseCache.get(key)
    const found = await payload.find({
      collection: 'exercises',
      where: { name: { equals: base } },
      limit: 1,
      depth: 0,
    })
    let id: number
    if (found.docs[0]) {
      id = found.docs[0].id
    } else {
      const created = await payload.create({ collection: 'exercises', data: { name: base } })
      id = created.id
      createdExercises++
    }
    exerciseCache.set(key, id)
    return id
  }

  // --- Czyszczenie TYLKO planów (katalog i dziennik zostają) ---
  for (const slug of ['workouts', 'microcycles', 'plans'] as const) {
    await payload.delete({ collection: slug, where: {} })
  }
  payload.logger.info('Wyczyszczono poprzednie dane planu (katalog/logi nietknięte)')

  const plan = await payload.create({
    collection: 'plans',
    data: { title: data.plan, source: 'plan-structured.json', status: 'active' },
  })

  let mcOrder = 0
  let totalWorkouts = 0
  let totalRows = 0
  for (const mc of data.microcycles) {
    const micro = await payload.create({
      collection: 'microcycles',
      data: {
        title: mc.name.replace(/\s+/g, ' ').trim(),
        plan: plan.id,
        rpe: mc.rpe ?? undefined,
        order: mcOrder++,
      },
    })

    let wOrder = 0
    for (const w of mc.workouts) {
      const sections = []
      for (const s of w.sections) {
        const groups = []
        for (const g of s.groups) {
          const exercises = []
          for (const ex of g.exercises) {
            const rawName = str(ex['Ćwiczenie']) || str(ex['_raw'])
            const { base, kg: kgFromName } = normalizeName(rawName)
            const exerciseId = await ensureExercise(base)
            exercises.push({
              numer: str(ex['Numer']),
              exercise: exerciseId,
              // note tylko gdy brak linku do katalogu (instrukcje EMOM/Snatch) — inaczej duplikat
              note: exerciseId ? '' : rawName,
              series: str(ex['Serie']),
              reps: str(ex['Powtórzenia']),
              rest: str(ex['Przerwa']) || str(ex['Przerwa (sekundy)']),
              tut: str(ex['TUT']),
              rir: str(ex['RIR']),
              kg: str(ex['KG']) || kgFromName || '',
              extra: buildExtra(ex),
            })
            totalRows++
          }
          groups.push({ setType: g.setType ?? undefined, exercises })
        }
        sections.push({ title: s.title ?? undefined, subtitle: s.subtitle ?? undefined, groups })
      }

      await payload.create({
        collection: 'workouts',
        data: {
          title: w.name,
          microcycle: micro.id,
          rpe: w.rpe ?? undefined,
          order: wOrder++,
          sections,
        },
      })
      totalWorkouts++
    }
  }

  payload.logger.info(
    `Zaimportowano: 1 plan, ${data.microcycles.length} mikrocykli, ${totalWorkouts} treningów, ` +
      `${totalRows} pozycji ćwiczeń; katalog: +${createdExercises} nowych, ${exerciseCache.size} unikalnych`,
  )
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
