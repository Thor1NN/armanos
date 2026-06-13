import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Aplikacja treningowa',
  title: 'Trening',
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
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
