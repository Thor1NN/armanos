'use client'

import { useTranslations } from 'next-intl'
import React from 'react'
import { CopyPlus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AddSetActions({ onAdd, onDuplicate }: { onAdd: () => void; onDuplicate?: () => void }) {
  const t = useTranslations('exercise')

  return (
    <div className="mt-1.5 flex items-center gap-2">
      <Button variant="dashed" className="gap-1" onClick={onAdd}>
        <Plus size={14} />
        {t('addSet')}
      </Button>
      {onDuplicate && (
        <Button variant="dashed" aria-label={t('duplicateSet')} onClick={onDuplicate}>
          <CopyPlus size={14} />
        </Button>
      )}
    </div>
  )
}
