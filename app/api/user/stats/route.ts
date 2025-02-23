import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // メールアドレスとIDの両方でユーザーを検索
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: session.user.email },
          { id: session.user.id }
        ]
      }
    })

    if (!user) {
      // ユーザーが見つからない場合は新規作成
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email.split('@')[0]
        }
      })
    }

    // 本日の利用時間を計算
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const userSessions = await prisma.userSession.findMany({
      where: {
        userId: user.id,
        startTime: {
          gte: today
        }
      }
    })

    // 利用時間を分単位で計算
    let totalMinutes = 0
    for (const userSession of userSessions) {
      const endTime = userSession.endTime || new Date()
      const duration = endTime.getTime() - userSession.startTime.getTime()
      totalMinutes += Math.floor(duration / (1000 * 60))
    }

    // 新しいセッションを作成または更新
    const currentSession = await prisma.userSession.findFirst({
      where: {
        userId: user.id,
        endTime: null
      }
    })

    if (!currentSession) {
      await prisma.userSession.create({
        data: {
          userId: user.id,
          startTime: new Date(),
        }
      })
    }

    return NextResponse.json({
      usageTime: totalMinutes
    })
  } catch (error) {
    console.error("[USER_STATS]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 