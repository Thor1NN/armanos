import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

export default function middleware(req: NextRequest) {
  const response = intlMiddleware(req) ?? NextResponse.next()

  // V1: public share links are disabled. Proactively clear any share-token
  // cookie left over from earlier versions instead of setting one.
  if (req.cookies.has('share-token')) {
    response.cookies.delete('share-token')
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon|images|admin|robots|manifest\\.webmanifest|sw\\.js).*)'],
}
