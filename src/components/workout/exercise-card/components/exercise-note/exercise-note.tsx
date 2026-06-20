'use client'

import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import { X } from 'lucide-react'
import { mutedTextClass } from '@/lib/class-names'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ExerciseNote({
  note,
  readOnly,
  onSave,
}: {
  note: string
  readOnly?: boolean
  onSave?: (note: string) => Promise<void>
}) {
  const t = useTranslations('exercise')
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(note)
  const [saving, setSaving] = useState(false)

  if (readOnly) {
    if (!note) return null
    return <div className={`mt-0.5 pl-7 text-xs italic ${mutedTextClass}`}>📝 {note}</div>
  }

  const open = () => {
    setValue(note)
    setEditing(true)
  }

  if (!editing) {
    return (
      <div className="mt-0.5 pl-7">
        {note ? (
          <button type="button" onClick={open} className={`text-left text-xs italic ${mutedTextClass}`}>
            📝 {note}
          </button>
        ) : (
          <Button variant="dashed" size="sm" onClick={open}>
            {t('addNote')}
          </Button>
        )}
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
    <div className="mt-1 flex items-center gap-1.5 pl-7">
      <Input
        className="w-full"
        type="text"
        value={value}
        autoFocus
        placeholder={t('notePlaceholder')}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button size="sm" onClick={submit} disabled={saving}>
        {saving ? '…' : t('saveNote')}
      </Button>
      <Button size="sm" variant="secondary" aria-label={t('cancelNote')} onClick={() => setEditing(false)}>
        <X size={13} strokeWidth={2.5} />
      </Button>
    </div>
  )
}
