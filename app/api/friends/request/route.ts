import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (!session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { userId } = await req.json()
    if (!userId || typeof userId !== 'string') {
      return new NextResponse('Invalid user ID', { status: 400 })
    }

    // 既存の申請をチェック
    const existingRequest = await prisma.friend.findFirst({
      where: {
        OR: [
          { AND: [{ senderId: session.user.id }, { receiverId: userId }] },
          { AND: [{ senderId: userId }, { receiverId: session.user.id }] }
        ]
      }
    })

    if (existingRequest) {
      return new NextResponse('Friend request already exists', { status: 400 })
    }

    // 新しい申請を作成
    await prisma.friend.create({
      data: {
        senderId: session.user.id,
        receiverId: userId,
        status: 'PENDING'
      }
    })

    return new NextResponse('Success', { status: 200 })
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 })
  }
} 