import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })
  const isAuth = !!token

  // システムルート以外はすべて認証が必要
  const systemPaths = ['/api', '/_next', '/favicon.ico']
  const isSystemPath = systemPaths.some(path => req.nextUrl.pathname.startsWith(path))

  // システムパスの場合は処理をスキップ
  if (isSystemPath) {
    return null
  }

  // ルートページ以外へのアクセスを制限
  if (req.nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return null
}

// ミドルウェアを適用するパスを設定
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}