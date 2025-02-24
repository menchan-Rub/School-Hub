import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import { db } from "@/lib/db"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name } = body

    console.log("登録開始:", { email, name })

    if (!email || !password || !name) {
      return new NextResponse(
        JSON.stringify({ error: "必須項目が不足しています" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // メールアドレスの重複チェック
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log("重複するメールアドレス:", email)
      return new NextResponse(
        JSON.stringify({ error: "このメールアドレスは既に使用されています" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const hashedPassword = await hash(password, 12)
    console.log("パスワードハッシュ化完了")

    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword,
        role: "user",
      }
    })

    console.log("ユーザー作成成功:", { id: user.id, email: user.email })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    })
  } catch (error) {
    console.error("ユーザー登録エラー:", error)
    return new NextResponse(
      JSON.stringify({ error: "内部サーバーエラー" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

