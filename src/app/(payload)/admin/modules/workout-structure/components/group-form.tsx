'use client'

import React, { useState } from 'react'
import { toast, useAuth, useDocumentInfo } from '@payloadcms/ui'
import type { Group } from '../types'
import { PROTOCOLS } from '../constants'
import { s } from '../styles'

type Props = {
  sectionRowId: string | undefined
  nextOrder: number
  initial?: Group
  onSaved: (group: Group) => void
  onCancel: () => void
}

export function GroupForm({ sectionRowId, nextOrder, initial, onSaved, onCancel }: Props) {
  const { token } = useAuth()
  const { id: docId } = useDocumentInfo()
  const isEdit = !!initial
  const [label, setLabel] = useState(initial?.label ?? '')
  const [protocol, setProtocol] = useState(initial?.protocol ?? 'standard')
  const [rounds, setRounds] = useState(initial?.rounds ?? '')
  const [durationMinutes, setDurationMinutes] = useState(String(initial?.durationMinutes ?? ''))
  const [intervalSeconds, setIntervalSeconds] = useState(String(initial?.intervalSeconds ?? '60'))
  const [workSeconds, setWorkSeconds] = useState(String(initial?.workSeconds ?? '20'))
  const [restSeconds, setRestSeconds] = useState(String(initial?.restSeconds ?? '10'))
  const [restBetweenRounds, setRestBetweenRounds] = useState(initial?.restBetweenRounds ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        label: label || null,
        protocol,
        rounds: rounds || null,
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        intervalSeconds: intervalSeconds ? Number(intervalSeconds) : null,
        workSeconds: workSeconds ? Number(workSeconds) : null,
        restSeconds: restSeconds ? Number(restSeconds) : null,
        restBetweenRounds: restBetweenRounds || null,
        ...(!isEdit && { workout: docId, sectionRowId: sectionRowId ?? '', order: nextOrder }),
      }

      const url = isEdit ? `/api/workout-groups/${initial!.id}` : '/api/workout-groups'
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.errors?.[0]?.message ?? 'Błąd zapisu')
      toast.success(isEdit ? 'Grupa zaktualizowana' : 'Grupa dodana')
      onSaved(data.doc)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd zapisu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={s.formBox}>
      <div style={{ ...s.label, fontSize: 12, fontWeight: 700, color: '#E8E8E8', marginBottom: 10 }}>
        {isEdit ? 'Edytuj grupę' : 'Nowa grupa'}
      </div>

      <div style={s.formRow}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={s.label}>Nazwa grupy (opcjonalna)</label>
          <input style={s.input} value={label} onChange={(e) => setLabel(e.target.value)} placeholder='np. Superset górny, Część A' />
        </div>
      </div>

      <div style={s.formRow}>
        <div style={{ flex: '1 1 140px' }}>
          <label style={s.label}>Protokół</label>
          <select style={s.select} value={protocol} onChange={(e) => setProtocol(e.target.value)}>
            {PROTOCOLS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {protocol !== 'amrap' && protocol !== 'tabata' && (
          <div style={{ flex: '1 1 80px' }}>
            <label style={s.label}>Serie / rundy</label>
            <input style={s.input} value={rounds} onChange={(e) => setRounds(e.target.value)} placeholder='np. 4, 1-3' />
          </div>
        )}

        {protocol === 'amrap' && (
          <div style={{ flex: '1 1 80px' }}>
            <label style={s.label}>Czas (min)</label>
            <input style={s.input} type='number' value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder='10' />
          </div>
        )}

        {protocol === 'emom' && (
          <div style={{ flex: '1 1 80px' }}>
            <label style={s.label}>Interwał (s)</label>
            <input style={s.input} type='number' value={intervalSeconds} onChange={(e) => setIntervalSeconds(e.target.value)} />
          </div>
        )}

        {protocol === 'tabata' && (
          <>
            <div style={{ flex: '1 1 70px' }}>
              <label style={s.label}>Praca (s)</label>
              <input style={s.input} type='number' value={workSeconds} onChange={(e) => setWorkSeconds(e.target.value)} />
            </div>
            <div style={{ flex: '1 1 70px' }}>
              <label style={s.label}>Odpoczynek (s)</label>
              <input style={s.input} type='number' value={restSeconds} onChange={(e) => setRestSeconds(e.target.value)} />
            </div>
          </>
        )}
      </div>

      <div style={s.formRow}>
        <div style={{ flex: '1 1 160px' }}>
          <label style={s.label}>Przerwa między rundami</label>
          <input style={s.input} value={restBetweenRounds} onChange={(e) => setRestBetweenRounds(e.target.value)} placeholder='np. 90 sek' />
        </div>
      </div>

      <div style={s.formActions}>
        <button style={s.btnSecondary} onClick={onCancel} disabled={saving}>Anuluj</button>
        <button style={s.btnPrimary} onClick={handleSave} disabled={saving}>
          {saving ? 'Zapisuję…' : isEdit ? 'Zapisz grupę' : 'Dodaj grupę'}
        </button>
      </div>
    </div>
  )
}
