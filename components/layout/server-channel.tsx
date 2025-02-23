"use client"

import { Channel, Server, MemberRole } from "@prisma/client"
import { Edit, Hash, Lock, Mic, Trash, Video } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ActionTooltip } from "@/components/action-tooltip"
import { useModal } from "@/hooks/use-modal-store"

interface ServerChannelProps {
  channel: Channel
  role: string
  server: Server
  onClick: () => void
}

const iconMap = {
  text: Hash,
  audio: Mic,
  video: Video
}

export function ServerChannel({ channel, role, server, onClick }: ServerChannelProps) {
  const { onOpen } = useModal()
  const router = useRouter()
  const params = useParams()

  const Icon = iconMap[channel.type]

  const onChannelClick = () => {
    router.push(`/${channel.id}`)
  }

  const onAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation()
    onOpen(action, { channel, server })
  }

  return (
    <button
      onClick={onChannelClick}
      className={cn(
        "group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1",
        params?.channelId === channel.id && "bg-zinc-700/20 dark:bg-zinc-700"
      )}
    >
      <Icon className="flex-shrink-0 w-4 h-4 text-zinc-500 dark:text-zinc-400" />
      <p className={cn(
        "line-clamp-1 font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition",
        params?.channelId === channel.id && "text-primary dark:text-zinc-200 dark:group-hover:text-white"
      )}>
        {channel.name}
      </p>
      {channel.name !== "general" && role !== MemberRole.GUEST && (
        <div className="ml-auto flex items-center gap-x-2">
          <ActionTooltip label="編集" side="top">
            <Edit
              onClick={(e) => onAction(e, "editChannel")}
              className="hidden group-hover:block w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
            />
          </ActionTooltip>
          <ActionTooltip label="削除" side="top">
            <Trash
              onClick={(e) => onAction(e, "deleteChannel")}
              className="hidden group-hover:block w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
            />
          </ActionTooltip>
        </div>
      )}
      {channel.name === "general" && (
        <Lock
          className="ml-auto w-4 h-4 text-zinc-500 dark:text-zinc-400"
        />
      )}
    </button>
  )
}