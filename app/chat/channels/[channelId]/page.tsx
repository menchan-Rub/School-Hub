"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useChatContext } from "stream-chat-react"
import { ChatMain } from "@/components/chat/chat-main"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function ChannelPage() {
  const params = useParams()
  const router = useRouter()
  const { client, setActiveChannel } = useChatContext()

  useEffect(() => {
    if (!client?.userID) {
      router.push("/login")
      return
    }

    const setupChannel = async () => {
      try {
        const channel = client.channel("messaging", params.channelId as string)
        await channel.watch()
        setActiveChannel(channel)
      } catch (error) {
        console.error("Failed to setup channel:", error)
        router.push("/chat")
      }
    }

    if (params.channelId) {
      setupChannel()
    }
  }, [client, params.channelId, router, setActiveChannel])

  if (!params.channelId || !client?.userID) {
    return <LoadingSpinner />
  }

  return <ChatMain />
} 