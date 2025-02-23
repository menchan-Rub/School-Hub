import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { StreamChat } from "stream-chat"

const serverClient = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAM_KEY!,
  process.env.STREAM_SECRET_KEY!
)

export async function PATCH(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { name, type } = await req.json()
    const channel = serverClient.channel("messaging", params.channelId)

    await channel.update({
      name,
      type: type.toLowerCase(),
    }, { user_id: session.user.id })

    return NextResponse.json(channel)
  } catch (error) {
    console.log("[CHANNEL_PATCH]", error)
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

    const channel = serverClient.channel("messaging", params.channelId)
    await channel.delete()

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.log("[CHANNEL_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 