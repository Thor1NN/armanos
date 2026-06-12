import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Aplikacja treningowa',
  title: 'Trening',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="pl">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
