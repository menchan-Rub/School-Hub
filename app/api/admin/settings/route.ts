import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// 設定を取得
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || !["super_admin", "admin"].includes(session.user.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const settings = await prisma.systemSettings.findFirst()
    return NextResponse.json(settings || {
      maintenance: false,
      language: 'ja',
      autoBackup: true,
      queryLogging: true,
      defaultLocale: 'ja-JP',
      timezone: 'Asia/Tokyo'
    })
  } catch (error) {
    console.error("[SETTINGS_GET_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// 設定を更新
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || !["super_admin", "admin"].includes(session.user.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { key, value } = body

    const settings = await prisma.systemSettings.upsert({
      where: { id: 1 },
      update: { [key]: value },
      create: {
        id: 1,
        maintenance: false,
        language: 'ja',
        autoBackup: true,
        queryLogging: true,
        defaultLocale: 'ja-JP',
        timezone: 'Asia/Tokyo',
        [key]: value
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("[SETTINGS_UPDATE_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 