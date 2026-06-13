/**
 * Import planu treningowego → nowa struktura
 *
 * Tworzy: plans → microcycles → workouts → workout-groups → workout-exercise-rows
 * Upsertuje katalog ćwiczeń (exercises) po nazwie kanonicznej.
 *
 * Obsługiwane formaty wierszy z JSON:
 *  - standard:  Numer, Ćwiczenie, Serie, Powtórzenia, Przerwa (sekundy), TUT, RIR, KG
 *  - circuit:   "Obwód rozgrzewkowy..." (Trening 2 rozgrzewka) — kolumny przesunięte w xlsx
 *  - emom:      sekcja z subtitle "EMOM", tylko Numer + Ćwiczenie + _extra
 *  - simple:    bez TUT/RIR/KG (rozgrzewki Trening 3)
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import { sql } from 'drizzle-orm'
import config from '../payload.config.js'
import { canonicalize } from './canonicalize-exercises.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA = path.resolve(dirname, '../data/plan-structured.json')

type RawExercise = Record<string, string | string[]>
type RawGroup = { setType: string | null; columns: string[] | null; exercises: RawExercise[] }
type RawSection = { title: string | null; subtitle: string | null; groups: RawGroup[] }
type RawWorkout = { name: string; rpe: number | null; sections: RawSection[] }
type RawMicro = { name: string; rpe: number | null; workouts: RawWorkout[] }
type RawPlan = { plan: string; microcycles: RawMicro[] }

const str = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? v.join(' ') : (v ?? '')

const orUndef = (s: string | undefined): string | undefined => (s?.trim() ? s.trim() : undefined)

/**
 * Parsuje wiersz ćwiczenia zależnie od formatu kolumn:
 *  - circuit: kolumna "Obwód rozgrzewkowy..." (xlsx-shift z Trening 2)
 *  - emom: sekcja subtitle "EMOM"
 *  - standard: normalny format
 */
function parseExerciseRow(
  ex: RawExercise,
  isCircuit: boolean,
  isEmom: boolean,
): {
  numer: string
  rawName: string
  rounds: string
  reps: string
  rest: string
  tut: string
  rir: string
  kgRaw: string
} {
  if (isCircuit) {
    // xlsx-shift: "Obwód..." = numer, "Serie" = nazwa ćwiczenia, "Przerwa" = rundy
    const extra = ex['_extra']
    return {
      numer: str(ex['Obwód rozgrzewkowy jedno po drugim ćwiczenie:']),
      rawName: str(ex['Serie']),
      rounds: str(ex['Przerwa']),
      reps: Array.isArray(extra) ? String(extra[0] ?? '') : '',
      rest: Array.isArray(extra) ? String(extra[1] ?? '') : '',
      tut: '',
      rir: '',
      kgRaw: '',
    }
  }

  if (isEmom) {
    const extra = ex['_extra']
    return {
      numer: str(ex['Numer']),
      rawName: str(ex['Ćwiczenie']),
      rounds: Array.isArray(extra) ? String(extra[1] ?? '') : '',
      reps: Array.isArray(extra) ? String(extra[0] ?? '') : '',
      rest: '',
      tut: '',
      rir: '',
      kgRaw: '',
    }
  }

  // standard / simple
  return {
    numer: str(ex['Numer']),
    rawName: str(ex['Ćwiczenie']),
    rounds: str(ex['Serie']),
    reps: str(ex['Powtórzenia']),
    rest: str(ex['Przerwa']) || str(ex['Przerwa (sekundy)']),
    tut: str(ex['TUT']),
    rir: str(ex['RIR']),
    kgRaw: str(ex['KG']),
  }
}

const run = async () => {
  const payload = await getPayload({ config })
  const data: RawPlan = JSON.parse(fs.readFileSync(DATA, 'utf-8'))

  // --- Katalog ćwiczeń: upsert po nazwie kanonicznej ---
  const exerciseCache = new Map<string, number>()
  let createdExercises = 0

  const ensureExercise = async (name: string): Promise<number | undefined> => {
    if (!name) return undefined
    const key = name.toLowerCase()
    if (exerciseCache.has(key)) return exerciseCache.get(key)

    const found = await payload.find({
      collection: 'exercises',
      where: { name: { equals: name } },
      limit: 1,
      depth: 0,
    })

    let id: number
    if (found.docs[0]) {
      id = found.docs[0].id
    } else {
      const created = await payload.create({ collection: 'exercises', data: { name } })
      id = created.id
      createdExercises++
    }
    exerciseCache.set(key, id)
    return id
  }

  // --- Czyszczenie przez bezpośredni SQL (omija hooki i payload_preferences) ---
  // payload.delete() odpala beforeDelete hooki które rzucają APIError gdy są logi,
  // co przerywa transakcję i psuje kolejne połączenia (PG error 25P02).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (payload.db as any).drizzle

  const { rows: countRows } = await db.execute(sql`
    SELECT
      (SELECT COUNT(*)::int FROM workout_logs)  AS workout_logs,
      (SELECT COUNT(*)::int FROM set_logs)      AS set_logs
  `)
  const counts = countRows[0] as { workout_logs: number; set_logs: number }
  const hasLogs = counts.workout_logs > 0 || counts.set_logs > 0

  if (hasLogs && !process.argv.includes('--force')) {
    payload.logger.error(
      `Znaleziono ${counts.workout_logs} sesji i ${counts.set_logs} serii w dzienniku.\n` +
        'Użyj flagi --force aby usunąć je razem z planem i przeimportować:\n' +
        '  yarn import:plan-v2 -- --force',
    )
    process.exit(1)
  }

  payload.logger.info('Czyszczenie danych planu (SQL)…')
  if (hasLogs) {
    payload.logger.warn(
      `Usuwam ${counts.workout_logs} sesji i ${counts.set_logs} serii z dziennika (--force)`,
    )
    await db.execute(sql`DELETE FROM set_logs`)
    await db.execute(sql`DELETE FROM round_logs`)
    await db.execute(sql`DELETE FROM workout_logs`)
  }
  await db.execute(sql`DELETE FROM workout_exercise_rows_set_parameters`)
  await db.execute(sql`DELETE FROM workout_exercise_rows`)
  await db.execute(sql`DELETE FROM workout_groups`)
  await db.execute(sql`DELETE FROM workouts_sections`)
  await db.execute(sql`DELETE FROM workouts`)
  await db.execute(sql`DELETE FROM microcycles`)
  await db.execute(sql`DELETE FROM plans`)
  payload.logger.info('Wyczyszczono (katalog ćwiczeń nienaruszone)')

  // --- Plan ---
  const plan = await payload.create({
    collection: 'plans',
    data: { title: data.plan, source: path.basename(DATA), status: 'active' },
  })

  let totalMicrocycles = 0
  let totalWorkouts = 0
  let totalGroups = 0
  let totalRows = 0

  for (const [mcIdx, mc] of data.microcycles.entries()) {
    const micro = await payload.create({
      collection: 'microcycles',
      data: {
        title: mc.name.replace(/\s*\(RPE\s*\d+\)/gi, '').replace(/\s+/g, ' ').trim(),
        plan: plan.id,
        rpe: mc.rpe ?? undefined,
        order: mcIdx,
      },
    })
    totalMicrocycles++

    for (const [wIdx, w] of mc.workouts.entries()) {
      // Workout: tylko sekcje z title+subtitle (bez grup/ćwiczeń)
      const workout = await payload.create({
        collection: 'workouts',
        data: {
          title: w.name.replace(/\s*\(RPE[:\s]*\d+\/?\d*\)/gi, '').replace(/\s+/g, ' ').trim(),
          microcycle: micro.id,
          rpe: w.rpe ?? undefined,
          order: wIdx,
          sections: w.sections.map((s) => ({
            title: s.title ?? undefined,
            subtitle: s.subtitle ?? undefined,
          })),
        },
      })
      totalWorkouts++

      // Odczytaj sekcje z ID nadanymi przez Payload
      const savedWorkout = await payload.findByID({
        collection: 'workouts',
        id: workout.id,
        depth: 0,
      })
      const savedSections = (savedWorkout.sections ?? []) as Array<{
        id?: string
        title?: string
        subtitle?: string
      }>

      for (const [sIdx, section] of w.sections.entries()) {
        const sectionRowId = savedSections[sIdx]?.id ?? String(sIdx)
        const isEmomSection = section.subtitle?.toLowerCase().includes('emom') ?? false

        for (const [gIdx, group] of section.groups.entries()) {
          const isCircuit =
            group.exercises[0] != null &&
            'Obwód rozgrzewkowy jedno po drugim ćwiczenie:' in group.exercises[0]

          // Dla EMOM: rundy całej grupy z _extra[1] pierwszego ćwiczenia
          let groupRounds: string | undefined
          if (isEmomSection) {
            const firstExtra = group.exercises[0]?.['_extra']
            groupRounds = Array.isArray(firstExtra) ? String(firstExtra[1] ?? '') : undefined
          }

          const wg = await payload.create({
            collection: 'workout-groups',
            data: {
              workout: workout.id,
              sectionRowId,
              label: group.setType ?? undefined,
              order: gIdx,
              protocol: isEmomSection ? 'emom' : 'standard',
              rounds: orUndef(groupRounds),
              intervalSeconds: isEmomSection ? 60 : undefined,
            },
          })
          totalGroups++

          for (const [exIdx, ex] of group.exercises.entries()) {
            const { numer, rawName, rounds, reps, rest, tut, rir, kgRaw } = parseExerciseRow(
              ex,
              isCircuit,
              isEmomSection,
            )

            const parsed = canonicalize(rawName)
            const exerciseId = await ensureExercise(parsed.canonical)

            // xlsx-shift dla Clean na dwa KB: pole KG zawiera rundy, nie ciężar
            const finalRounds = parsed.roundsFromKgField ? (orUndef(kgRaw) ?? orUndef(rounds)) : orUndef(rounds)
            const finalKg = parsed.roundsFromKgField ? orUndef(parsed.kg ?? '') : orUndef(parsed.kg ?? kgRaw)

            await payload.create({
              collection: 'workout-exercise-rows',
              data: {
                group: wg.id,
                order: exIdx,
                numer: orUndef(numer),
                exercise: exerciseId,
                note: orUndef(parsed.note),
                rounds: finalRounds,
                reps: orUndef(reps),
                kg: finalKg,
                tut: orUndef(tut),
                rir: orUndef(rir),
                rest: orUndef(rest),
              },
            })
            totalRows++
          }
        }
      }
    }
  }

  payload.logger.info(
    `Import zakończony: 1 plan | ${totalMicrocycles} mikrocykli | ${totalWorkouts} treningów | ` +
      `${totalGroups} grup | ${totalRows} wierszy ćwiczeń | ` +
      `katalog: +${createdExercises} nowych (${exerciseCache.size} unikalnych)`,
  )
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
