"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useChatContext } from "stream-chat-react"
import { toast } from "sonner"
import { ServerSidebar } from "@/components/chat/server-sidebar"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function ServerPage() {
  const params = useParams()
  const router = useRouter()
  const { client, setActiveChannel } = useChatContext()

  useEffect(() => {
    if (!client?.userID) {
      router.push("/chat")
      return
    }

    const setupChannel = async () => {
      try {
        const channel = client.channel("team", params.serverId as string)
        await channel.watch()
        setActiveChannel(channel)
      } catch (error) {
        console.error("Failed to setup channel:", error)
        toast.error("チャンネルの読み込みに失敗しました")
      }
    }

    if (params.serverId) {
      setupChannel()
    }
  }, [client, params.serverId, setActiveChannel, router])

  if (!params.serverId || !client?.userID) {
    return <LoadingSpinner />
  }

  return (
    <div className="flex h-full">
      <ServerSidebar serverId={params.serverId as string} />
      <div className="h-full flex-1 bg-white dark:bg-[#313338]">
        <div className="flex flex-col h-full">
          <div className="flex items-center h-12 px-3 border-b border-neutral-200 dark:border-neutral-800">
            <p className="font-semibold text-md text-black dark:text-white">
              チャンネルを選択してください
            </p>
          </div>
          <div className="flex-1 p-4">
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                左のチャンネル一覧からチャンネルを選択してチャットを開始できます
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 