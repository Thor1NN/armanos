'use client'

import React, { useState } from 'react'
import { Pencil, Plus, X } from 'lucide-react'
import { mutedTextClass } from '@/lib/class-names'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export type NoteLabels = {
  label: string
  add: string
  edit: string
  placeholder: string
  save: string
  cancel: string
}

export function NoteField({
  note,
  labels,
  readOnly,
  onSave,
}: {
  note: string
  labels: NoteLabels
  readOnly?: boolean
  onSave?: (note: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(note)
  const [saving, setSaving] = useState(false)

  if (readOnly) {
    if (!note) return null
    return (
      <div className={`text-xs italic ${mutedTextClass}`}>
        {labels.label} {note}
      </div>
    )
  }

  const open = () => {
    setValue(note)
    setEditing(true)
  }

  if (!editing) {
    return (
      <div className={`flex items-center justify-between gap-1 text-xs italic ${mutedTextClass}`}>
        <span>
          {labels.label}
          {note ? ` ${note}` : ''}
        </span>
        <Button variant="dashed" aria-label={note ? labels.edit : labels.add} onClick={open}>
          {note ? <Pencil size={14} /> : <Plus size={14} />}
        </Button>
      </div>
    )
  }

  const submit = async () => {
    setSaving(true)
    try {
      await onSave?.(value)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        className="w-full"
        type="text"
        value={value}
        autoFocus
        placeholder={labels.placeholder}
        onChange={(event) => setValue(event.target.value)}
      />
      <Button size="sm" onClick={submit} disabled={saving}>
        {saving ? '…' : labels.save}
      </Button>
      <Button size="sm" variant="secondary" aria-label={labels.cancel} onClick={() => setEditing(false)}>
        <X size={13} strokeWidth={2.5} />
      </Button>
    </div>
  )
}
