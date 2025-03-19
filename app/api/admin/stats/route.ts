import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || !["super_admin", "admin"].includes(session.user.role as string)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // 統計データの取得
    const [totalUsers, activeUsers, totalServers, totalMessages] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          userSessions: {
            some: {
              endTime: null
            }
          }
        }
      }),
      prisma.server.count(),
      prisma.message.count()
    ])

    // 月間アクティブユーザー数の取得
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const monthlyActiveUsers = await prisma.userSession.groupBy({
      by: ['startTime'],
      where: {
        startTime: {
          gte: thirtyDaysAgo
        }
      },
      _count: {
        userId: true
      }
    })

    // 日付でソートして整形
    const formattedMonthlyData = monthlyActiveUsers
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .map(day => {
        // 月の名前を取得
        const date = new Date(day.startTime);
        const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
        const month = monthNames[date.getMonth()];
        
        return {
          month: month,
          count: day._count.userId
        };
      });

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalServers,
      totalMessages,
      monthlyActiveUsers: formattedMonthlyData
    })
  } catch (error) {
    console.error("[ADMIN_STATS]", error instanceof Error ? error.message : error)
    return new NextResponse(
      JSON.stringify({ 
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "不明なエラーが発生しました"
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
} 