import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { StreamChat } from "stream-chat"
import { authOptions } from "@/lib/auth"

const serverClient = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAM_KEY!,
  process.env.STREAM_SECRET_KEY!
)

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("認証が必要です", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get("channelId")
    const limit = parseInt(searchParams.get("limit") || "50")

    const channel = serverClient.channel("messaging", channelId!)
    const { messages } = await channel.query({
      messages: { limit }
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error("[MESSAGES_GET]", error)
    return new NextResponse("内部エラーが発生しました", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("認証が必要です", { status: 401 })
    }

    const { channelId, content, attachments, mentionedUsers } = await req.json()
    const channel = serverClient.channel("messaging", channelId)

    const message = await channel.sendMessage({
      text: content,
      user_id: session.user.id,
      attachments,
      mentioned_users: mentionedUsers,
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error("[MESSAGES_POST]", error)
    return new NextResponse("内部エラーが発生しました", { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("認証が必要です", { status: 401 })
    }

    const { channelId, messageId, content } = await req.json()
    const channel = serverClient.channel("messaging", channelId)

    const message = await channel.updateMessage({
      id: messageId,
      text: content,
      user_id: session.user.id,
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error("[MESSAGES_PATCH]", error)
    return new NextResponse("内部エラーが発生しました", { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("認証が必要です", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get("channelId")
    const messageId = searchParams.get("messageId")

    const channel = serverClient.channel("messaging", channelId!)
    await channel.deleteMessage(messageId!)

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error("[MESSAGES_DELETE]", error)
    return new NextResponse("内部エラーが発生しました", { status: 500 })
  }
}

