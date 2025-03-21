"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useModal } from "@/lib/hooks/use-modal-store"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export const LeaveServerModal = () => {
  const { isOpen, onClose, type, data } = useModal()
  const router = useRouter()

  const isModalOpen = isOpen && type === "leaveServer"
  const { server } = data
  
  const [isLoading, setIsLoading] = useState(false)

  const onClick = async () => {
    try {
      setIsLoading(true)

      await fetch(`/api/servers/${server?.id}/leave`, {
        method: "PATCH"
      })

      onClose()
      router.refresh()
      router.push("/")
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
            サーバーを退出
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            本当に<span className="font-semibold text-indigo-500">{server?.name}</span>から退出しますか？
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
              variant="primary"
              onClick={onClick}
            >
              退出
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
