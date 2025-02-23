"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { StreamChat } from "stream-chat"
import { Chat } from "stream-chat-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

const apiKey = process.env.NEXT_PUBLIC_STREAM_KEY!

export function ChatLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [client, setClient] = useState<StreamChat | null>(null)

  useEffect(() => {
    if (!session?.user) {
      router.push("/login")
      return
    }

    const client = StreamChat.getInstance(apiKey)

    const connectUser = async () => {
      try {
        await client.connectUser(
          {
            id: session.user.id,
            name: session.user.name || "",
            image: session.user.image || "",
          },
          client.devToken(session.user.id)
        )
        setClient(client)
      } catch (error) {
        console.error("Failed to connect user:", error)
      }
    }

    connectUser()

    return () => {
      client.disconnectUser()
      setClient(null)
    }
  }, [session, router])

  if (!client || !session) {
    return <LoadingSpinner />
  }

  return (
    <Chat client={client} theme="messaging dark">
      {children}
    </Chat>
  )
} 