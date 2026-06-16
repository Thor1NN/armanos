import React from 'react'

export function Logo({ className }: { className?: string }) {
  // The logo is a vector SVG and needs no rasterized optimization, so a plain img is intentional here.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/images/logo.svg" alt="Logo" className={className} />
}
