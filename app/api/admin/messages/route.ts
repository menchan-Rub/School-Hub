import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["admin", "super_admin"].includes(session.user.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const messages = await prisma.messageLog.findMany({
      select: {
        id: true,
        content: true,
        createdAt: true,
        flagged: true,
        userId: true,
        channelId: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      flagged: msg.flagged
    }))

    return NextResponse.json(formattedMessages)
  } catch (error) {
    console.error('API Error:', error instanceof Error ? error.message : 'Unknown error')
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 