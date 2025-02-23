"use client"

import { useCallback } from "react"
import { useMessageInputContext } from "stream-chat-react"
import { Plus, Send } from "lucide-react"
import { useModal } from "@/hooks/use-modal-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function CustomMessageInput() {
  const { onOpen } = useModal()
  const {
    text,
    handleSubmit,
    setText,
    attachments,
  } = useMessageInputContext()

  const handleFormSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      handleSubmit()
      setText('')
    },
    [handleSubmit, setText]
  )

  return (
    <div className="p-4 bg-white dark:bg-[#313338]">
      <form
        onSubmit={handleFormSubmit}
        className="flex items-center gap-x-2"
      >
        <Button
          type="button"
          onClick={() => onOpen("messageFile")}
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-zinc-500/10 dark:hover:bg-zinc-500/50"
        >
          <Plus className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
        </Button>
        <Input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="メッセージを入力..."
          className="px-4 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
        />
        <Button
          type="submit"
          variant="default"
          size="icon"
          disabled={!text && !attachments?.length}
          className="h-9 w-9"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  )
} 