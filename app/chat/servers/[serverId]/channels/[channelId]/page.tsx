"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { useChatContext } from "stream-chat-react"
import { ServerSidebar } from "@/components/chat/server-sidebar"
import { ChatMessages } from "@/components/chat/chat-messages"
import { ChatInput } from "@/components/chat/chat-input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function ChannelPage() {
  const params = useParams()
  const { client, setActiveChannel } = useChatContext()

  useEffect(() => {
    const setupChannel = async () => {
      const channel = client.channel("messaging", params.channelId as string)
      await channel.watch()
      setActiveChannel(channel)
    }

    if (client && params.channelId) {
      setupChannel()
    }
  }, [client, params.channelId, setActiveChannel])

  if (!params.channelId || !params.serverId) {
    return <LoadingSpinner />
  }

  return (
    <div className="flex h-full">
      <ServerSidebar serverId={params.serverId as string} />
      <div className="h-full flex-1 flex flex-col">
        <ChatMessages
          chatId={params.channelId as string}
          apiUrl="/api/messages"
          socketUrl="/api/socket/messages"
          socketQuery={{
            channelId: params.channelId,
            serverId: params.serverId,
          }}
          paramKey="channelId"
          paramValue={params.channelId}
          type="channel"
        />
        <ChatInput
          apiUrl="/api/messages"
          query={{
            channelId: params.channelId,
            serverId: params.serverId,
          }}
          name={params.channelId as string}
          type="channel"
        />
      </div>
    </div>
  )
} 