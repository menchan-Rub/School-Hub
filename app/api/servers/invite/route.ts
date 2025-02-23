import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { StreamChat } from "stream-chat"

const serverClient = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAM_KEY!,
  process.env.STREAM_SECRET_KEY!
)

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return new NextResponse("認証が必要です", { status: 401 })
    }

    const { serverId, email } = await req.json()
    const channel = serverClient.channel("team", serverId)

    const user = await serverClient.queryUsers({ email })
    if (!user.users.length) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 })
    }

    await channel.addMembers([user.users[0].id])

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.log("[SERVER_INVITE_POST]", error)
    return new NextResponse("内部エラーが発生しました", { status: 500 })
  }
} 