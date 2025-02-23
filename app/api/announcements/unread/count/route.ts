import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const unreadCount = await prisma.announcement.count({
      where: {
        published: true,
        read: {
          none: {
            userId: session.user.id
          }
        }
      }
    })

    return NextResponse.json(unreadCount)
  } catch (error) {
    console.error("[ANNOUNCEMENTS_UNREAD_COUNT_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 