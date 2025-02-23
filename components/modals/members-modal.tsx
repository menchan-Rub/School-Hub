"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useModal } from "@/lib/hooks/use-modal-store"
import type { ServerWithMembersWithProfiles } from "@/lib/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserAvatar } from "@/components/user-avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Check, Gavel, Loader2, MoreVertical, Shield, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react"

const roleIconMap = {
  GUEST: null,
  MODERATOR: <ShieldCheck className="h-4 w-4 ml-2 text-indigo-500" />,
  ADMIN: <ShieldAlert className="h-4 w-4 text-rose-500" />,
}

export const MembersModal = () => {
  const router = useRouter()
  const { onOpen, isOpen, onClose, type, data } = useModal()
  const [loadingId, setLoadingId] = useState("")

  const isModalOpen = isOpen && type === "members"
  const { server } = data as { server: ServerWithMembersWithProfiles }

  const onKick = async (memberId: string) => {
    try {
      setLoadingId(memberId)
      const response = await fetch(`/api/members/${memberId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to kick member")
      }

      router.refresh()
      onOpen("members", { server: { ...server, members: server.members.filter((member) => member.id !== memberId) } })
    } catch (error) {
      console.log(error)
    } finally {
      setLoadingId("")
    }
  }

  const onRoleChange = async (memberId: string, role: string) => {
    try {
      setLoadingId(memberId)
      const response = await fetch(`/api/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        throw new Error("Failed to change role")
      }

      router.refresh()
      onOpen("members", {
        server: {
          ...server,
          members: server.members.map((member) => {
            if (member.id === memberId) {
              return { ...member, roles: [role] }
            }
            return member
          }),
        },
      })
    } catch (error) {
      console.log(error)
    } finally {
      setLoadingId("")
    }
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white text-black overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">メンバー管理</DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            {server?.members?.length} メンバー
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="mt-8 max-h-[420px] pr-6">
          {server?.members?.map((member) => (
            <div key={member.id} className="flex items-center gap-x-2 mb-6">
              <UserAvatar src={member.user.image} />
              <div className="flex flex-col gap-y-1">
                <div className="text-xs font-semibold flex items-center gap-x-1">
                  {member.user.name}
                  {roleIconMap[member.roles[0] as keyof typeof roleIconMap]}
                </div>
                <p className="text-xs text-zinc-500">{member.user.email}</p>
              </div>
              {server.ownerId !== member.userId && loadingId !== member.id && (
                <div className="ml-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <MoreVertical className="h-4 w-4 text-zinc-500" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="left">
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="flex items-center">
                          <ShieldQuestion className="w-4 h-4 mr-2" />
                          <span>ロール</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => onRoleChange(member.id, "GUEST")}>
                              <Shield className="h-4 w-4 mr-2" />
                              ゲスト
                              {member.roles[0] === "GUEST" && <Check className="h-4 w-4 ml-auto" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onRoleChange(member.id, "MODERATOR")}>
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              モデレーター
                              {member.roles[0] === "MODERATOR" && <Check className="h-4 w-4 ml-auto" />}
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onKick(member.id)}>
                        <Gavel className="h-4 w-4 mr-2" />
                        キック
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              {loadingId === member.id && <Loader2 className="animate-spin text-zinc-500 ml-auto w-4 h-4" />}
            </div>
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

