import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["admin", "super_admin"].includes(session.user.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const stats = await prisma.messageLog.groupBy({
      by: ['userId'],
      _count: true
    })

    const total = stats.reduce((acc: number, curr: { _count: number }) => acc + curr._count, 0)
    const flagged = await prisma.messageLog.count({
      where: { 
        flagged: true
      }
    })

    return NextResponse.json({ total, flagged })
  } catch (error) {
    console.error("[MESSAGE_STATS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}