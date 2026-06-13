import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Clients } from './collections/Clients'
import { Media } from './collections/Media'
import { Plans } from './collections/Plans'
import { Microcycles } from './collections/Microcycles'
import { Workouts } from './collections/Workouts'
import { WorkoutGroups } from './collections/WorkoutGroups'
import { WorkoutExerciseRows } from './collections/WorkoutExerciseRows'
import { WorkoutLogs } from './collections/WorkoutLogs'
import { RoundLogs } from './collections/RoundLogs'
import { SetLogs } from './collections/SetLogs'
import { Exercises } from './collections/Exercises'

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
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
})
