import { getPayload } from 'payload'
import config from './src/payload.config'
const payload = await getPayload({ config })
const email = `rest2-${Date.now()}@t.local`
const client = await payload.create({ collection: 'clients', data: { email, password: 'correct-horse-battery-staple', name: 'Rest' } })
const plan = await payload.create({ collection: 'plans', data: { title: 'P', client: client.id, status: 'active' } })
const mc = await payload.create({ collection: 'microcycles', data: { title: 'W1', plan: plan.id, order: 0 } })
const w = await payload.create({ collection: 'workouts', data: { title: 'D', microcycle: mc.id, order: 0 } })
const login = await fetch('http://localhost:3210/api/clients/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'correct-horse-battery-staple' }) })
const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0]
const me = await fetch('http://localhost:3210/api/clients/me', { headers: { cookie, origin: 'http://localhost:3210' } })
console.log('me', me.status, JSON.stringify((await me.json()).user?.email ?? null))
for (const headers of [
  { cookie },
  { cookie, origin: 'http://localhost:3210' },
  { cookie, Origin: 'http://localhost:3210', referer: 'http://localhost:3210/' },
]) {
  const res = await fetch('http://localhost:3210/api/workout-logs', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ workout: w.id }) })
  console.log('create', Object.keys(headers).join('+'), res.status, JSON.stringify(await res.json()).slice(0, 120))
}
process.exit(0)
