import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })
  const isAuth = !!token
  const isAuthPage = req.nextUrl.pathname === "/"

  // 認証ページでの処理
  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    return null
  }

  // 認証が必要なページでの処理
  if (!isAuth) {
    return NextResponse.redirect(new URL("/", req.url))
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