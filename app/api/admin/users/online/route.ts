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

    // 現在のユーザーのアクティブセッションを取得
    const userSessions = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      include: {
        role: true,
        sessions: {
          where: {
            endTime: null
          }
        }
      }
    })

    if (!userSessions) {
      return new NextResponse("User not found", { status: 404 })
    }

    return NextResponse.json({
      ...userSessions,
      role: userSessions?.role.name,
      activeSessions: userSessions?.sessions
    })
  } catch (error) {
    console.error("[USER_SESSIONS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}