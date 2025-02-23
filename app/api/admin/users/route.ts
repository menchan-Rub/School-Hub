import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { mockUsers } from "@/lib/mock-data"
import { hash } from "bcryptjs"
import { StreamChat } from "stream-chat"

const serverClient = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAM_KEY!,
  process.env.STREAM_SECRET_KEY!
)

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["admin", "super_admin"].includes(session.user.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // 開発モードの場合はモックデータを返す
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") {
      return NextResponse.json(mockUsers)
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("[USERS_GET]", error instanceof Error ? error.message : String(error))
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, ...data } = body

    const user = await prisma.user.update({
      where: { id },
      data
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("[USER_PUT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { id } = await req.json()

    await prisma.user.delete({
      where: { id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[USER_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["admin", "super_admin"].includes(session.user.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { name, email, password, role = "user" } = await req.json()

    if (!name || !email || !password) {
      return new NextResponse("必須項目が不足しています", { status: 400 })
    }

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return new NextResponse("このメールアドレスは既に使用されています", { status: 400 })
    }

    // パスワードのハッシュ化
    const hashedPassword = await hash(password, 10)

    // Prismaでユーザーを作成
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        status: "active"
      }
    })

    // Stream Chatにもユーザーを作成
    await serverClient.upsertUser({
      id: user.id,
      name: user.name,
      role: user.role,
    })

    // パスワードを除外してレスポンスを返す
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)

  } catch (error) {
    console.error("[USERS_POST]", error)
    return new NextResponse("ユーザーの作成に失敗しました", { status: 500 })
  }
} 