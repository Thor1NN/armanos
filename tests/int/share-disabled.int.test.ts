import { describe, expect, it } from 'vitest'
import { TEST_BASE_URL } from './helpers'

/** V1 ships with the public share feature fully disabled. */
describe('share links disabled', () => {
  it('the public share route always 404s', async () => {
    const res = await fetch(`${TEST_BASE_URL}/share/any-token-at-all`)
    expect(res.status).toBe(404)
  })

  it('unauthenticated requests cannot read logs or structure', async () => {
    for (const collection of ['workout-logs', 'set-logs', 'exercise-logs', 'workouts', 'plans']) {
      const res = await fetch(`${TEST_BASE_URL}/api/${collection}`)
      expect(res.status, collection).toBeGreaterThanOrEqual(401)
    }
  })
})
