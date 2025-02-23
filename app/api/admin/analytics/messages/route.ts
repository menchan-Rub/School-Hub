import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { subDays } from "date-fns"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["admin", "super_admin"].includes(session.user.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // 過去7日間のメッセージ数を集計
    const dailyMessages = await prisma.message.groupBy({
      by: ['createdAt'],
      _count: {
        _all: true
      },
      where: {
        createdAt: {
          gte: subDays(new Date(), 7)
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // アクティブユーザー数
    const activeUsers = await prisma.message.groupBy({
      by: ['senderId'],
      where: {
        createdAt: {
          gte: subDays(new Date(), 1)
        }
      }
    })

    // フラグ付きメッセージの割合
    const flaggedMessages = await prisma.messageLog.count({
      where: {
        flagged: true
      }
    })

    const totalMessages = await prisma.messageLog.count()

    return NextResponse.json({
      dailyMessages: dailyMessages.map(day => ({
        date: day.createdAt,
        count: day._count
      })),
      activeUsers: activeUsers.length,
      flaggedRatio: {
        flagged: flaggedMessages,
        normal: totalMessages - flaggedMessages
      }
    })
  } catch (error) {
    console.error("[MESSAGE_ANALYTICS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 