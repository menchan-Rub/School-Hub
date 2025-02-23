import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (!session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id }
    })

    if (!settings) {
      // デフォルト設定を作成
      const defaultSettings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
          theme: 'system',
          notifications: {
            messages: true,
            friendRequests: true,
            updates: true
          },
          privacy: {
            showOnlineStatus: true,
            allowFriendRequests: true,
            showLastSeen: true
          },
          language: 'ja',
          timezone: 'Asia/Tokyo'
        }
      })
      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json(settings)
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const updates = await req.json()
    const settings = await prisma.userSettings.update({
      where: { userId: session.user.id },
      data: updates
    })

    return NextResponse.json(settings)
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 })
  }
} 