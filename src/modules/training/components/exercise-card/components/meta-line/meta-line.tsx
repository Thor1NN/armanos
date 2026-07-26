import React from 'react'
import { mutedTextClass } from '@/lib/class-names'

// pl-7 indents the text to align under the exercise name, past the min-w-7 numer badge in the header.
export function MetaLine({ children }: { children: React.ReactNode }) {
  return <div className={`mt-0.5 pl-7 text-xs ${mutedTextClass}`}>{children}</div>
}
