'use client'

import { useTranslations } from 'next-intl'
import React from 'react'
import type { RegisterOptions, UseFormRegister } from 'react-hook-form'
import { mutedTextClass } from '@/lib/class-names'
import { BODYWEIGHT_KEY } from '@/lib/metric-keys'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { Values } from '@/types/workout'

export function BodyweightField({
  label,
  placeholder,
  autoFocus,
  register,
  registerOptions,
  isBodyweight,
  onToggleBodyweight,
}: {
  label: string
  placeholder?: string
  autoFocus: boolean
  register: UseFormRegister<Values>
  registerOptions: RegisterOptions<Values>
  isBodyweight: boolean
  onToggleBodyweight: () => void
}) {
  const t = useTranslations('seriesForm')

  return (
    <Field label={label}>
      {isBodyweight ? (
        <button
          type="button"
          onClick={onToggleBodyweight}
          className={`h-8 rounded-md border border-ui-border-base bg-ui-bg-subtle px-2.5 text-xs ${mutedTextClass} text-left`}
        >
          {t('bodyweightActive')}
        </button>
      ) : (
        <span className="inline-flex items-stretch gap-1">
          <Input
            variant="compact"
            type="number"
            step="0.5"
            placeholder={placeholder}
            autoFocus={autoFocus}
            {...register('weight', registerOptions)}
          />
          <button
            type="button"
            onClick={onToggleBodyweight}
            title={t('bodyweightTitle')}
            className={`rounded-md border border-ui-border-base bg-ui-bg-subtle px-2 text-xs ${mutedTextClass} hover:bg-ui-bg-base-hover`}
          >
            MC
          </button>
        </span>
      )}
      <input type="hidden" {...register(BODYWEIGHT_KEY)} />
    </Field>
  )
}
