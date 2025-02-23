import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { friendships } from "@/lib/db/schema"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { eq, and, or } from "drizzle-orm"
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const [friends, pendingRequests] = await Promise.all([
      // 承認済みのフレンド
      prisma.friend.findMany({
        where: {
          OR: [
            { senderId: session.user.id, status: 'ACCEPTED' },
            { receiverId: session.user.id, status: 'ACCEPTED' }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      }),
      // 保留中のフレンド申請
      prisma.friend.findMany({
        where: {
          receiverId: session.user.id,
          status: 'PENDING'
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      })
    ])

    return NextResponse.json({ friends, pendingRequests })
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return new NextResponse("認証が必要です", { status: 401 })
  }

  if (!session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { friendId } = await req.json()
  if (!friendId || typeof friendId !== 'string') {
    return new NextResponse("Invalid friend ID", { status: 400 })
  }
  
  const friendship = await prisma.friend.create({
    data: {
      senderId: session.user.id,
      receiverId: friendId,
      status: "PENDING"
    }
  })

  return NextResponse.json(friendship)
} 