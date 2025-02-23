"use client"

import { ReactNode, useEffect, useState } from "react"
import { StreamChat } from "stream-chat"
import { Chat } from "stream-chat-react"
import { useSession } from "next-auth/react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface ChatProviderProps {
  children: ReactNode
}

export function ChatProvider({ children }: ChatProviderProps) {
  const { data: session } = useSession()
  const [client, setClient] = useState<StreamChat | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return

    const streamClient = StreamChat.getInstance(
      process.env.NEXT_PUBLIC_STREAM_KEY!
    )

    const connectUser = async () => {
      try {
        const response = await fetch('/api/chat/token')
        const { token } = await response.json()

        await streamClient.connectUser(
          {
            id: session.user.id,
            name: session.user.name || "",
            image: session.user.image || "",
          },
          token
        )
        setClient(streamClient)
      } catch (error) {
        console.error("StreamChat connection error:", error)
      }
    }

    connectUser()

    return () => {
      streamClient.disconnectUser()
      setClient(null)
    }
  }, [session?.user])

  if (!client) {
    return <LoadingSpinner />
  }

  return (
    <Chat client={client}>
      {children}
    </Chat>
  )
}