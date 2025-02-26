import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new NextResponse("認証が必要です", { status: 401 })
  }

  const body = await req.json()
  const { name, email, notifications, privacy } = body

  try {
    const updatedUser = await db
      .update(users)
      .set({
        name: name ?? undefined,
        email: email ?? undefined,
        settings: {
          notifications,
          privacy,
          theme: body.theme,
          language: body.language,
        },
      })
      .where(eq(users.id, session.user.id))
      .returning()

    return NextResponse.json(updatedUser[0])
  } catch (error) {
    return new NextResponse("設定の更新に失敗しました", { status: 500 })
  }
}