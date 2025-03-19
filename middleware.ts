import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  // 認証トークンを取得
  const token = await getToken({ req })
  const isAuth = !!token

  // システムパスとAPIパスのリストを定義（リダイレクトしないパス）
  const systemPaths = [
    '/api',  // APIエンドポイント
    '/_next', // Next.jsの内部ファイル
    '/favicon.ico', // ファビコン
    '/', // ルートページ
    '/login', // ログインページ
  ]

  // 現在のパスがシステムパスかどうかをチェック
  const isSystemPath = systemPaths.some(path => req.nextUrl.pathname.startsWith(path))

  // APIエンドポイントはリダイレクトしない
  if (req.nextUrl.pathname.startsWith('/api')) {
    return null
  }

  // /_nextパスもリダイレクトしない
  if (req.nextUrl.pathname.startsWith('/_next')) {
    return null
  }

  // システムパス以外はすべてルートページにリダイレクト
  // すべての機能はルートページで実装されている
  if (!isSystemPath) {
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