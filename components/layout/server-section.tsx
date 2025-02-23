"use client"

import { ServerWithMembersWithUsers } from "@/types"
import { ChannelType, MemberRole } from "@prisma/client"
import { Plus, Settings } from "lucide-react"
import { ActionTooltip } from "@/components/action-tooltip"
import { useModal } from "@/hooks/use-modal-store"

interface ServerSectionProps {
  label: string
  role?: MemberRole
  sectionType?: "channels" | "members"
  channelType?: ChannelType
  server?: ServerWithMembersWithUsers
  children: React.ReactNode
}

export function ServerSection({
  label,
  role,
  sectionType,
  channelType,
  server,
  children
}: ServerSectionProps) {
  const { onOpen } = useModal()

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between py-2">
        <p className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        {role !== MemberRole.GUEST && sectionType === "channels" && (
          <ActionTooltip label="チャンネルを作成" side="top">
            <button
              onClick={() => onOpen("createChannel", { channelType })}
              className="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
            >
              <Plus className="h-4 w-4" />
            </button>
          </ActionTooltip>
        )}
        {role === MemberRole.ADMIN && sectionType === "members" && (
          <ActionTooltip label="メンバー管理" side="top">
            <button
              onClick={() => onOpen("members", { server })}
              className="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
            >
              <Settings className="h-4 w-4" />
            </button>
          </ActionTooltip>
        )}
      </div>
      <div className="space-y-[2px]">
        {children}
      </div>
    </div>
  )
} 