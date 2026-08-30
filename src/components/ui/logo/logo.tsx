import React from 'react'

export function Logo({ className }: { className?: string }) {
  // White vector mark — kept on a dark chip so it reads on light surfaces.
  return (
    <span className="inline-flex items-center justify-center rounded-2xl bg-[#0e1013] p-2.5 shadow-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/logo.svg" alt="Logo" className={className} />
    </span>
  )
}
