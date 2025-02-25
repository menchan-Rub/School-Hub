import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { withAuth } from 'next-auth/middleware'

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req })
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname === "/"

    // 認証済みユーザーは常に/にリダイレクト
    if (!isAuthPage && isAuth) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    // 未認証ユーザーも/にリダイレクト
    if (!isAuth) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    return null
  },
  {
    callbacks: {
      async authorized() {
        return true
      },
    },
  }
)

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