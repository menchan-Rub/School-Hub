import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["admin", "super_admin"].includes(session.user.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const updates = await req.json()

    // システム設定を更新
    await prisma.systemSettings.update({
      where: { id: 1 }, // システム設定は通常1レコードのみ
      data: updates
    })

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error("[SETTINGS_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 