import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

// お知らせ一覧の取得
export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        readBy: true
      }
    })

    const formattedAnnouncements = announcements.map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
      readCount: announcement.readBy.length
    }))

    return NextResponse.json(formattedAnnouncements)
  } catch (error) {
    console.error("[ANNOUNCEMENTS_ERROR]", { error: error instanceof Error ? error.message : 'Unknown error' })
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// お知らせの作成（管理者のみ）
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // ユーザーIDの取得
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      },
      select: {
        id: true
      }
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    // 管理者権限のチェック
    if (session.user.role !== 'super_admin') {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await req.json()
    const {
      title,
      content,
      type = "INFO",
      priority = 0,
      published = false,
      startDate = new Date(),
      endDate,
      targetUsers = []
    } = body

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type,
        priority,
        published,
        startDate,
        endDate,
        targetUsers
      }
    })

    return NextResponse.json(announcement)
  } catch (error) {
    // エラーメッセージの整形
    const message = error instanceof Error ? error.message : '不明なエラーが発生しました'
    console.error("[ANNOUNCEMENTS_POST]", { error: message })
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return new NextResponse(
        JSON.stringify({ 
          code: error.code,
          message: "データベースエラーが発生しました" 
        }),
        { status: 400 }
      )
    }

    return new NextResponse(
      JSON.stringify({ message: "Internal Server Error" }),
      { status: 500 }
    )
  }
} 