import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { StreamChat } from "stream-chat"

const serverClient = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAM_KEY!,
  process.env.STREAM_SECRET_KEY!
)

export async function POST(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { userId } = await req.json()
    const channel = serverClient.channel("messaging", params.channelId)

    await channel.addMembers([userId])

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.log("[CHANNEL_MEMBERS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return new NextResponse("User ID missing", { status: 400 })
    }

    const channel = serverClient.channel("messaging", params.channelId)
    await channel.removeMembers([userId])

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.log("[CHANNEL_MEMBERS_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 