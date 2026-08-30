import { execSync, spawn, type ChildProcess } from 'child_process'

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://training:training@localhost:55432/training_test'
export const TEST_SERVER_PORT = Number(process.env.TEST_SERVER_PORT ?? 3210)
export const TEST_BASE_URL = `http://localhost:${TEST_SERVER_PORT}`

const env = {
  ...process.env,
  DATABASE_URL: TEST_DATABASE_URL,
  PAYLOAD_SECRET: process.env.PAYLOAD_SECRET ?? 'armanos-test-secret-0123456789',
  NEXT_PUBLIC_BASE_URL: TEST_BASE_URL,
  PORT: String(TEST_SERVER_PORT),
  NODE_OPTIONS: '--no-deprecation',
}

let server: ChildProcess | null = null

const waitForServer = async (): Promise<void> => {
  const deadline = Date.now() + 90_000
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${TEST_BASE_URL}/api/clients/me`)
      if (res.status < 500) return
    } catch {
      /* not up yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('Test server did not become ready in 90s')
}

export async function setup(): Promise<void> {
  // 1. Migrate the dedicated test database (never the dev/prod one).
  execSync('yarn payload migrate', { env, stdio: 'inherit' })

  // 2. Reset data tables so runs are repeatable.
  process.env.DATABASE_URL = TEST_DATABASE_URL
  process.env.PAYLOAD_SECRET = env.PAYLOAD_SECRET
  process.env.NEXT_PUBLIC_BASE_URL = TEST_BASE_URL
  const { getPayload } = await import('payload')
  const { default: config } = await import('../../src/payload.config')
  const payload = await getPayload({ config })
  const drizzle = (payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } })
    .drizzle
  const { sql } = await import('@payloadcms/db-postgres')
  await drizzle.execute(sql`
    TRUNCATE TABLE set_logs, exercise_logs, round_logs, workout_logs,
      workout_exercise_rows, workout_groups, workouts, microcycles,
      share_links, plans, _plans_v, exercises, _clients_v, clients, users,
      payload_preferences, payload_locked_documents
      RESTART IDENTITY CASCADE
  `)

  // 3. Boot the production server against the test DB (requires `yarn build`).
  // A leftover server from a crashed run would silently serve a stale build —
  // refuse to run against one.
  const portTaken = await fetch(`${TEST_BASE_URL}/api/clients/me`).then(
    () => true,
    () => false,
  )
  if (portTaken) {
    throw new Error(
      `Port ${TEST_SERVER_PORT} is already in use (stale test server?). Kill it first: lsof -ti :${TEST_SERVER_PORT} | xargs kill`,
    )
  }
  server = spawn('yarn', ['start'], { env, stdio: 'ignore', detached: false })
  await waitForServer()
}

export async function teardown(): Promise<void> {
  if (server && !server.killed) server.kill('SIGTERM')
}
