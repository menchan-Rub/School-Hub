"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useModal } from "@/lib/hooks/use-modal-store"
import qs from "query-string"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export const DeleteChannelModal = () => {
  const { isOpen, onClose, type, data } = useModal()
  const router = useRouter()

  const isModalOpen = isOpen && type === "deleteChannel"
  const { server, channel } = data
  
  const [isLoading, setIsLoading] = useState(false)

  const onClick = async () => {
    try {
      setIsLoading(true)
      const url = qs.stringifyUrl({
        url: `/api/channels/${channel?.id}`,
        query: {
          serverId: server?.id
        }
      })

      await fetch(url, {
        method: "DELETE",
      })

      onClose()
      router.refresh()
      router.push(`/servers/${server?.id}`)
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            チャンネルを削除
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            本当に<span className="font-semibold text-indigo-500">#{channel?.name}</span>を削除しますか？<br />
            この操作は取り消せません。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="bg-gray-100 px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <Button
              disabled={isLoading}
              onClick={onClose}
              variant="ghost"
            >
              キャンセル
            </Button>
            <Button
              disabled={isLoading}
              variant="destructive"
              onClick={onClick}
            >
              削除
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
