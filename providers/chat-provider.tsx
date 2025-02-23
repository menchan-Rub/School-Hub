"use client"

import { ReactNode, useEffect, useState } from "react"
import { StreamChat } from "stream-chat"
import { Chat } from "stream-chat-react"
import { useSession } from "next-auth/react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface ChatProviderProps {
  children: ReactNode
}

const client = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_KEY!)

export function ChatProvider({ children }: ChatProviderProps) {
  const session = useSession()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!session?.data?.user) {
      return
    }

    const connectUser = async () => {
      try {
        await client.connectUser(
          {
            id: session.data.user.id,
            name: session.data.user.name || undefined,
            image: session.data.user.image || undefined,
          },
          client.devToken(session.data.user.id)
        )

        setIsLoading(false)
      } catch (error) {
        console.error("Failed to connect user:", error)
      }
    }

    connectUser()

    return () => {
      client.disconnectUser()
      setIsLoading(true)
    }
  }, [session?.data?.user])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <Chat client={client}>
      {children}
    </Chat>
  )
} 