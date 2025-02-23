"use client"

import { ChevronDown, UserPlus, Settings, Users, PlusCircle, Trash } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useModal } from "@/hooks/use-modal-store"

interface ServerHeaderProps {
  serverId: string
  name: string
}

export function ServerHeader({
  serverId,
  name,
}: ServerHeaderProps) {
  const { onOpen } = useModal()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="focus:outline-none"
        asChild
      >
        <button
          className="w-full text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2 hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition"
        >
          {name}
          <ChevronDown className="h-5 w-5 ml-auto" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 text-xs font-medium text-black dark:text-neutral-400 space-y-[2px]"
      >
        <DropdownMenuItem
          onClick={() => onOpen("invite", { serverId })}
          className="text-indigo-600 dark:text-indigo-400 px-3 py-2 text-sm cursor-pointer"
        >
          メンバーを招待
          <UserPlus className="h-4 w-4 ml-auto" />
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onOpen("members", { serverId })}
          className="px-3 py-2 text-sm cursor-pointer"
        >
          メンバー管理
          <Users className="h-4 w-4 ml-auto" />
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onOpen("createChannel", { serverId })}
          className="px-3 py-2 text-sm cursor-pointer"
        >
          チャンネルを作成
          <PlusCircle className="h-4 w-4 ml-auto" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onOpen("settings", { serverId })}
          className="px-3 py-2 text-sm cursor-pointer"
        >
          サーバー設定
          <Settings className="h-4 w-4 ml-auto" />
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onOpen("deleteServer", { serverId })}
          className="text-rose-500 px-3 py-2 text-sm cursor-pointer"
        >
          サーバーを削除
          <Trash className="h-4 w-4 ml-auto" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 