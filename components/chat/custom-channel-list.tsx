"use client"

import { useEffect } from "react"
import { ChannelList, useChatContext } from "stream-chat-react"
import { useRouter } from "next/navigation"
import { Hash, Plus, Settings, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useModal } from "@/hooks/use-modal-store"

export function CustomChannelList() {
  const { setActiveChannel } = useChatContext()
  const { onOpen } = useModal()
  const router = useRouter()

  const CustomChannelPreview = (props: any) => {
    const { channel } = props
    const isActive = channel.id === props.activeChannel?.id

    return (
      <div
        className={`
          flex items-center px-2 py-2 rounded-md cursor-pointer
          ${isActive ? 'bg-zinc-700/20 dark:bg-zinc-700' : 'hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50'}
        `}
        onClick={() => setActiveChannel(channel)}
      >
        <Hash className="h-5 w-5 text-zinc-500 dark:text-zinc-400 mr-2" />
        <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
          {channel.data?.name || 'チャンネル'}
        </span>
      </div>
    )
  }

  return (
    <div className="w-60 flex flex-col h-full bg-[#F2F3F5] dark:bg-[#2B2D31]">
      <div className="p-3 border-b dark:border-neutral-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">チャンネル</h2>
          <Button
            onClick={() => onOpen("createChannel")}
            variant="ghost"
            size="icon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={() => onOpen("videoCall")}
          variant="secondary"
          className="w-full"
          size="sm"
        >
          <Video className="h-4 w-4 mr-2" />
          ビデオ通話
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="mt-2">
          <ChannelList
            filters={{}}
            sort={{ last_message_at: -1 }}
            options={{ state: true, presence: true, limit: 10 }}
            Preview={CustomChannelPreview}
          />
        </div>
      </ScrollArea>
      <div className="p-3 mt-auto border-t dark:border-neutral-800">
        <Button
          onClick={() => onOpen("settings")}
          variant="ghost"
          className="w-full justify-start"
          size="sm"
        >
          <Settings className="h-4 w-4 mr-2" />
          設定
        </Button>
      </div>
    </div>
  )
} 