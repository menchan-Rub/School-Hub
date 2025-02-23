import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { StreamChat } from "stream-chat"
import { authOptions } from "@/lib/auth"

const serverClient = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAM_KEY!,
  process.env.STREAM_SECRET_KEY!
)

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("認証が必要です", { status: 401 })
    }

    const token = serverClient.createToken(session.user.id)
    if (!token) {
      return new NextResponse("トークンの生成に失敗しました", { status: 500 })
    }

    // 明示的にContent-Typeを指定
    return new NextResponse(JSON.stringify({ token }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error("[CHAT_TOKEN_GET]", error)
    return new NextResponse("内部エラーが発生しました", { status: 500 })
  }
} 