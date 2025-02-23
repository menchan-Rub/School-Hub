import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

// お知らせを既読にする
export async function POST(
  req: Request,
  { params }: { params: { announcementId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // お知らせの存在確認
    const announcement = await prisma.announcementRead.findFirst({
      where: {
        announcementId: params.announcementId,
        userId: session.user.id
      }
    })

    if (announcement) {
      return new NextResponse(
        JSON.stringify({ message: "既に既読済みです" }),
        { status: 400 }
      )
    }

    // 既読状態を記録
    const read = await prisma.announcementRead.create({
      data: {
        userId: session.user.id,
        announcementId: params.announcementId
      },
      include: {
        announcement: true
      }
    })

    return NextResponse.json(read)
  } catch (error) {
    const message = error instanceof Error ? error.message : '不明なエラーが発生しました'
    console.error("[ANNOUNCEMENT_READ_POST]", { error: message })
    
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

// お知らせの既読状態を解除
export async function DELETE(
  req: Request,
  { params }: { params: { announcementId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // 既読状態を削除
    await prisma.announcementRead.deleteMany({
      where: {
        AND: [
          { userId: session.user.id },
          { announcementId: params.announcementId }
        ]
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const message = error instanceof Error ? error.message : '不明なエラーが発生しました'
    console.error("[ANNOUNCEMENT_READ_DELETE]", { error: message })
    
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