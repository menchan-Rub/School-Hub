import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface UserSessionStats {
  id: string
  startTime: Date
  endTime: Date | null
  duration: number | null
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // 今日の日付の開始時刻と終了時刻を取得
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 今日のユーザーセッションを取得
    const todaysSessions = await prisma.$queryRaw<UserSessionStats[]>`
      SELECT id, "startTime", "endTime", duration
      FROM "UserSession"
      WHERE "userId" = ${session.user.id}
      AND "startTime" >= ${today}
      AND "startTime" < ${tomorrow}
    `

    // 総利用時間を計算（分単位）
    const totalMinutes = todaysSessions.reduce((total: number, userSession: UserSessionStats) => {
      if (userSession.duration) {
        return total + userSession.duration
      }
      // セッションが終了していない場合は現在時刻までの時間を計算
      const endTime = userSession.endTime || new Date()
      const durationInMinutes = Math.floor((endTime.getTime() - userSession.startTime.getTime()) / (1000 * 60))
      return total + durationInMinutes
    }, 0)

    // 時間と分に変換
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    return NextResponse.json({
      usageTime: {
        hours,
        minutes
      },
      totalSessions: todaysSessions.length
    })
  } catch (error) {
    console.error("[USER_STATS_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 