import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'

type HandlerFunction = (req: Request, session: Session) => Promise<NextResponse>

export async function withAuth(handler: HandlerFunction) {
  return async function(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    return handler(req, session)
  }
} 