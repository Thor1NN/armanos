import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import {
  Users,
  Clients,
  Media,
  Plans,
  Microcycles,
  Workouts,
  WorkoutGroups,
  WorkoutExerciseRows,
  WorkoutLogs,
  RoundLogs,
  SetLogs,
  ExerciseLogs,
  Exercises,
  ShareLinks,
  DiaryEntries,
  Foods,
  BodyMeasurements,
} from './collections'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

// Allowed CORS / CSRF-trusted origins, comma-separated; defaults to the serverURL.
// Use this to permit additional origins (e.g. a `www.` variant) without changing code.
const allowedOrigins = (process.env.PAYLOAD_CORS ?? serverURL)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

// Fail fast on a misconfigured deploy: a missing secret or DB URL should crash at
// startup with a clear message, not boot with an empty secret / no database.
function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

const payloadSecret = requiredEnv('PAYLOAD_SECRET')
const databaseURL = requiredEnv('DATABASE_URL')

export default buildConfig({
  serverURL,
  // Restrict cross-origin requests and CSRF-trusted origins to our own domain(s).
  cors: allowedOrigins,
  csrf: allowedOrigins,
  // GraphQL is not used by the app; disable it to shrink the public API surface.
  graphQL: {
    disable: true,
  },
  // Cap upload size at the multipart parser to reject oversized files early.
  upload: {
    limits: {
      fileSize: 5_000_000, // 5 MB
    },
    abortOnLimit: true,
  },
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Clients,
    Media,
    Plans,
    Microcycles,
    Workouts,
    WorkoutGroups,
    WorkoutExerciseRows,
    WorkoutLogs,
    RoundLogs,
    SetLogs,
    ExerciseLogs,
    Exercises,
    ShareLinks,
    DiaryEntries,
    Foods,
    BodyMeasurements,
  ],
  editor: lexicalEditor(),
  secret: payloadSecret,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    // Never auto-sync schema from models. Schema changes go through migrations only
    // (migrate:create + migrate), so `yarn dev` can never push to a remote/prod DB.
    push: false,
    pool: {
      connectionString: databaseURL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
    logger: false,
  }),
  sharp,
})
