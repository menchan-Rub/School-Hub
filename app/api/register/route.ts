import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { StreamChat } from "stream-chat"

const serverClient = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAM_KEY!,
  process.env.STREAM_SECRET_KEY!
)

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return new NextResponse("必須項目が入力されていません", { status: 400 })
    }

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return new NextResponse("このメールアドレスは既に登録されています", { status: 400 })
    }

    const hashedPassword = await hash(password, 10)

    // Prismaでユーザーを作成
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "user",
        status: "active"
      }
    })

    // Stream Chatにもユーザーを作成
    await serverClient.upsertUser({
      id: user.id,
      name: user.name,
      role: "user",
    })

    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)

  } catch (error) {
    console.error("[REGISTER_POST]", error)
    return new NextResponse("ユーザー登録に失敗しました", { status: 500 })
  }
}

