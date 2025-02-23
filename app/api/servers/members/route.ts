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

    const { serverId, userId, role } = await req.json()
    const channel = serverClient.channel("team", serverId)

    await channel.addMembers([userId], { role })

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.log("[SERVER_MEMBERS_POST]", error)
    return new NextResponse("内部エラーが発生しました", { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return new NextResponse("認証が必要です", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const serverId = searchParams.get("serverId")
    const userId = searchParams.get("userId")

    if (!serverId || !userId) {
      return new NextResponse("サーバーIDとユーザーIDが必要です", { status: 400 })
    }

    const { role } = await req.json()
    const channel = serverClient.channel("team", serverId)

    await channel.addMembers([userId], { role })

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.log("[SERVER_MEMBERS_PATCH]", error)
    return new NextResponse("内部エラーが発生しました", { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return new NextResponse("認証が必要です", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const serverId = searchParams.get("serverId")
    const userId = searchParams.get("userId")

    if (!serverId || !userId) {
      return new NextResponse("サーバーIDとユーザーIDが必要です", { status: 400 })
    }

    const channel = serverClient.channel("team", serverId)
    await channel.removeMembers([userId])

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.log("[SERVER_MEMBERS_DELETE]", error)
    return new NextResponse("内部エラーが発生しました", { status: 500 })
  }
} 