import { getPayload, type Payload } from 'payload'

export const TEST_BASE_URL = `http://localhost:${process.env.TEST_SERVER_PORT ?? 3210}`

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://training:training@localhost:55432/training_test'
process.env.PAYLOAD_SECRET = process.env.PAYLOAD_SECRET ?? 'armanos-test-secret-0123456789'
process.env.NEXT_PUBLIC_BASE_URL = TEST_BASE_URL

let cached: Payload | null = null

export async function getTestPayload(): Promise<Payload> {
  if (cached) return cached
  const { default: config } = await import('../../src/payload.config')
  cached = await getPayload({ config })
  return cached
}

export const PASSWORD = 'correct-horse-battery-staple'

let counter = 0
export const uniqueEmail = (prefix: string) => `${prefix}-${Date.now()}-${counter++}@test.local`

export async function createCoach(payload: Payload) {
  return payload.create({
    collection: 'users',
    data: { email: uniqueEmail('coach'), password: PASSWORD },
  })
}

export async function createClient(payload: Payload, name = 'Test Client') {
  return payload.create({
    collection: 'clients',
    data: { email: uniqueEmail('client'), password: PASSWORD, name, status: 'active' },
  })
}

/** Minimal plan chain: plan → microcycle → workout → group → exercise row. */
export async function createPlanChain(payload: Payload, clientId: number) {
  const plan = await payload.create({
    collection: 'plans',
    data: { title: 'Test plan', client: clientId, status: 'active' },
  })
  const microcycle = await payload.create({
    collection: 'microcycles',
    data: { title: 'Week 1', plan: plan.id, order: 0 },
  })
  const workout = await payload.create({
    collection: 'workouts',
    data: { title: 'Day A', microcycle: microcycle.id, order: 0 },
  })
  const group = await payload.create({
    collection: 'workout-groups',
    data: { workout: workout.id, protocol: 'standard', order: 0 },
  })
  const row = await payload.create({
    collection: 'workout-exercise-rows',
    data: { group: group.id, order: 0, numer: '1a', note: 'Bench press', rest: '90' },
  })
  return { plan, microcycle, workout, group, row }
}

/** Logs in over REST and returns an authed fetch bound to the session cookie. */
export async function loginClient(email: string, password = PASSWORD) {
  const res = await fetch(`${TEST_BASE_URL}/api/clients/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(`Login failed: ${res.status}`)
  const setCookie = res.headers.get('set-cookie') ?? ''
  const cookie = setCookie.split(';')[0]
  if (!cookie.includes('payload-token')) throw new Error('No auth cookie returned')

  return async (path: string, init: RequestInit = {}) =>
    fetch(`${TEST_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
        cookie,
      },
    })
}
