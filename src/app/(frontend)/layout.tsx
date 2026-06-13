import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Aplikacja treningowa',
  title: 'Trening',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="pl">
      <body className="bg-app-bg text-app-text">
        <main>{children}</main>
      </body>
    </html>
  )
}
