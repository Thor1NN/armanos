import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { createClient, getTestPayload, loginClient } from './helpers'

/** Diary entries are strictly owner-scoped and validated. */
describe('diary entries', () => {
  let payload: Payload
  let fetchA: Awaited<ReturnType<typeof loginClient>>
  let fetchB: Awaited<ReturnType<typeof loginClient>>
  let clientA: { id: number }
  let entryId: number

  beforeAll(async () => {
    payload = await getTestPayload()
    clientA = await createClient(payload, 'Diary A')
    const clientB = await createClient(payload, 'Diary B')
    fetchA = await loginClient((clientA as { email?: string }).email as string)
    fetchB = await loginClient((clientB as { email?: string }).email as string)
  })

  it('creates an entry with the owner forced server-side', async () => {
    const res = await fetchA('/api/diary-entries', {
      method: 'POST',
      body: JSON.stringify({
        kind: 'meal',
        text: 'Oats and eggs',
        entryDate: new Date().toISOString(),
        client: 999999, // forged — must be ignored
      }),
    })
    expect(res.status).toBe(201)
    const { doc } = await res.json()
    entryId = doc.id
    const owner = typeof doc.client === 'object' ? doc.client?.id : doc.client
    expect(owner).toBe(clientA.id)
  })

  it('hides entries from other clients', async () => {
    const listB = await fetchB('/api/diary-entries?limit=50').then((r) => r.json())
    expect(listB.totalDocs).toBe(0)
    const direct = await fetchB(`/api/diary-entries/${entryId}`)
    expect(direct.status).toBeGreaterThanOrEqual(403)
    const update = await fetchB(`/api/diary-entries/${entryId}`, {
      method: 'PATCH',
      body: JSON.stringify({ text: 'hacked' }),
    })
    expect(update.status).toBeGreaterThanOrEqual(403)
  })

  it('rejects empty text', async () => {
    const res = await fetchA('/api/diary-entries', {
      method: 'POST',
      body: JSON.stringify({ kind: 'note', text: '   ', entryDate: new Date().toISOString() }),
    })
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  it('computes meal calories server-side and ignores forged values', async () => {
    const food = await payload.create({
      collection: 'foods',
      data: { name: `Test Rice ${Date.now()}`, kcalPer100g: 130 },
    })
    const res = await fetchA('/api/diary-entries', {
      method: 'POST',
      body: JSON.stringify({
        kind: 'meal',
        entryDate: new Date().toISOString(),
        items: [
          // Catalog item: kcalPer100g forged to 1 — must come from the catalog.
          { food: food.id, grams: 200, kcalPer100g: 1, kcal: 1 },
          // Custom item: kcal forged — must be grams * kcalPer100g / 100.
          { name: 'Homemade sauce', grams: 50, kcalPer100g: 200, kcal: 9999 },
        ],
        totalKcal: 5, // forged — must be recomputed
      }),
    })
    expect(res.status).toBe(201)
    const { doc } = await res.json()
    expect(doc.items[0].kcal).toBe(260) // 200g × 130/100
    expect(doc.items[0].kcalPer100g).toBe(130)
    expect(doc.items[1].kcal).toBe(100) // 50g × 200/100
    expect(doc.totalKcal).toBe(360)
  })

  it('rejects invalid grams and custom items without kcal', async () => {
    const bad = await fetchA('/api/diary-entries', {
      method: 'POST',
      body: JSON.stringify({
        kind: 'meal',
        entryDate: new Date().toISOString(),
        items: [{ name: 'Air', grams: 0, kcalPer100g: 100 }],
      }),
    })
    expect(bad.status).toBeGreaterThanOrEqual(400)

    const noKcal = await fetchA('/api/diary-entries', {
      method: 'POST',
      body: JSON.stringify({
        kind: 'meal',
        entryDate: new Date().toISOString(),
        items: [{ name: 'Mystery', grams: 100 }],
      }),
    })
    expect(noKcal.status).toBeGreaterThanOrEqual(400)
  })

  it('clients can read the food catalog but not write it', async () => {
    const list = await fetchA('/api/foods?limit=1')
    expect(list.status).toBe(200)
    const write = await fetchA('/api/foods', {
      method: 'POST',
      body: JSON.stringify({ name: 'Hacked food', kcalPer100g: 1 }),
    })
    expect(write.status).toBeGreaterThanOrEqual(403)
  })

  it('owner can update and delete their entry', async () => {
    const update = await fetchA(`/api/diary-entries/${entryId}`, {
      method: 'PATCH',
      body: JSON.stringify({ text: 'Oats, eggs and fruit' }),
    })
    expect(update.status).toBe(200)
    const del = await fetchA(`/api/diary-entries/${entryId}`, { method: 'DELETE' })
    expect(del.status).toBe(200)
  })
})
