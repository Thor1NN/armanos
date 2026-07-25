import 'server-only'

import type { Payload } from 'payload'
import React from 'react'

type NavigationProps = {
  id?: number | string
  payload: Payload
}

const containerStyle: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 8,
  marginTop: 16,
  padding: 16,
}

const linkStyle: React.CSSProperties = {
  color: 'var(--theme-success-500)',
  textDecoration: 'none',
}

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  margin: '12px 0 0',
  padding: 0,
}

const breadcrumbStyle: React.CSSProperties = {
  alignItems: 'center',
  background: 'var(--theme-elevation-50)',
  border: '1px solid var(--theme-border-color)',
  borderRadius: 'var(--style-radius-m)',
  color: 'var(--theme-elevation-500)',
  display: 'flex',
  flexWrap: 'wrap',
  fontSize: 13,
  gap: 8,
  padding: '10px 12px',
}

const breadcrumbSeparatorStyle: React.CSSProperties = {
  color: 'var(--theme-elevation-300)',
}

const isExistingDocument = (id?: number | string): id is number | string => Boolean(id && id !== 'create')

export async function PlanMicrocycles({ id, payload }: NavigationProps) {
  if (!isExistingDocument(id)) return null

  const result = await payload.find({
    collection: 'microcycles',
    depth: 0,
    limit: 100,
    sort: 'order',
    where: { plan: { equals: id } },
  })

  return (
    <section style={containerStyle}>
      <strong>Microcycles</strong>
      {result.docs.length === 0 ? (
        <div style={{ color: 'var(--theme-elevation-500)', fontSize: 13, marginTop: 8 }}>No microcycles yet.</div>
      ) : (
        <ul style={listStyle}>
          {result.docs.map((microcycle) => (
            <li key={microcycle.id} style={{ listStyle: 'none' }}>
              <a href={`/admin/collections/microcycles/${microcycle.id}`} style={linkStyle}>
                {microcycle.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export async function MicrocycleWorkouts({ id, payload }: NavigationProps) {
  if (!isExistingDocument(id)) return null

  const result = await payload.find({
    collection: 'workouts',
    depth: 0,
    limit: 100,
    sort: 'order',
    where: { microcycle: { equals: id } },
  })

  return (
    <section style={containerStyle}>
      <strong>Workouts</strong>
      {result.docs.length === 0 ? (
        <div style={{ color: 'var(--theme-elevation-500)', fontSize: 13, marginTop: 8 }}>No workouts yet.</div>
      ) : (
        <ul style={listStyle}>
          {result.docs.map((workout) => (
            <li key={workout.id} style={{ listStyle: 'none' }}>
              <a href={`/admin/collections/workouts/${workout.id}/structure`} style={linkStyle}>
                {workout.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export async function WorkoutStructureBreadcrumb({ id, payload }: NavigationProps) {
  if (!isExistingDocument(id)) return null

  const workout = await payload.findByID({ collection: 'workouts', depth: 2, id })
  const microcycle = typeof workout.microcycle === 'object' ? workout.microcycle : null
  const plan = microcycle && typeof microcycle.plan === 'object' ? microcycle.plan : null

  return (
    <nav aria-label="Workout structure navigation" style={breadcrumbStyle}>
      {plan && <a href={`/admin/collections/plans/${plan.id}`} style={linkStyle}>{plan.title}</a>}
      {plan && microcycle && <span style={breadcrumbSeparatorStyle}>/</span>}
      {microcycle && <a href={`/admin/collections/microcycles/${microcycle.id}`} style={linkStyle}>{microcycle.title}</a>}
      {microcycle && <span style={breadcrumbSeparatorStyle}>/</span>}
      <a href={`/admin/collections/workouts/${workout.id}`} style={linkStyle}>{workout.title}</a>
      <span style={breadcrumbSeparatorStyle}>/</span>
      <span>Structure</span>
    </nav>
  )
}
