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
  Exercises,
  ShareLinks,
} from './collections'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
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
    Exercises,
    ShareLinks,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    // Never auto-sync schema from models. Schema changes go through migrations only
    // (migrate:create + migrate), so `yarn dev` can never push to a remote/prod DB.
    push: false,
    pool: {
      connectionString: process.env.DATABASE_URL || '',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
    logger: false,
  }),
  sharp,
})
