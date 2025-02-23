"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useChatContext } from "stream-chat-react"
import { ChatMain } from "@/components/chat/chat-main"

export default function ChatPage() {
  const router = useRouter()
  const { client } = useChatContext()

  useEffect(() => {
    if (!client?.userID) {
      router.push("/login")
      return
    }

    // デフォルトチャンネルへ移動
    router.push("/chat/channels/general")
  }, [client?.userID, router])

  return (
    <div className="h-full">
      <ChatMain />
    </div>
  )
} 