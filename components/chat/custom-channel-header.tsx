"use client"

import { Hash, Users } from "lucide-react"
import { useChannelStateContext } from "stream-chat-react"
import { Button } from "@/components/ui/button"
import { useModal } from "@/hooks/use-modal-store"

export function CustomChannelHeader() {
  const { channel } = useChannelStateContext()
  const { onOpen } = useModal()

  return (
    <div className="flex items-center justify-between px-3 h-12 border-b-2 border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center space-x-2">
        <Hash className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
        <span className="font-semibold text-md text-black dark:text-white">
          {channel?.data?.name || "チャンネル"}
        </span>
      </div>
      <div className="flex items-center">
        <Button
          onClick={() => onOpen("members", { channelId: channel?.id })}
          variant="ghost"
          size="icon"
          className="hover:bg-zinc-500/10 dark:hover:bg-zinc-500/50"
        >
          <Users className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
        </Button>
      </div>
    </div>
  )
} 