import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

export default function middleware(req: NextRequest) {
  const response = intlMiddleware(req) ?? NextResponse.next()

  const match = req.nextUrl.pathname.match(/\/share\/([^/]+)/)
  if (match) {
    const token = match[1]
    response.cookies.set('share-token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      // Server-side expiry is authoritative; this just stops the cookie from
      // lingering in the browser indefinitely.
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon|images|admin|robots).*)'],
}
