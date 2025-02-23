import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { StreamChat } from "stream-chat"
import { authOptions } from "@/lib/auth"

const serverClient = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAM_KEY!,
  process.env.STREAM_SECRET_KEY!
)

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("認証が必要です", { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const channelId = formData.get("channelId") as string

    if (!file) {
      return new NextResponse("ファイルが必要です", { status: 400 })
    }

    const channel = serverClient.channel("messaging", channelId)
    const response = await channel.sendFile(file)

    return NextResponse.json(response)
  } catch (error) {
    console.error("[FILES_POST]", error)
    return new NextResponse("内部エラーが発生しました", { status: 500 })
  }
} 