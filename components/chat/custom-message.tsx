"use client"

import { useCallback } from "react"
import { Message, useMessageContext } from "stream-chat-react"
import { FileIcon } from "lucide-react"
import Image from "next/image"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { UserAvatar } from "@/components/user-avatar"

const DATE_FORMAT = "yyyy年MM月dd日 HH:mm"

export function CustomMessage() {
  const {
    message,
    isMyMessage,
    handleOpenThread,
    handleAction,
  } = useMessageContext()

  const handleDelete = useCallback(async () => {
    if (message.id) {
      await handleAction("delete", message)
    }
  }, [handleAction, message])

  const isPDF = message.attachments?.[0]?.type === "file"
  const isImage = message.attachments?.[0]?.type === "image"

  return (
    <div className={`flex items-start gap-x-3 p-4 ${isMyMessage() ? "flex-row-reverse" : ""}`}>
      <UserAvatar src={message.user?.image} />
      <div className={`flex flex-col gap-y-2 ${isMyMessage() ? "items-end" : ""}`}>
        <div className="flex items-center gap-x-2">
          <p className="text-sm font-semibold">
            {message.user?.name}
          </p>
          <span className="text-xs text-zinc-500">
            {format(new Date(message.created_at!), DATE_FORMAT, { locale: ja })}
          </span>
        </div>
        {message.text && (
          <p className={`text-sm ${isMyMessage() ? "text-right" : ""}`}>
            {message.text}
          </p>
        )}
        {isImage && message.attachments?.[0]?.image_url && (
          <div className="relative aspect-square w-48">
            <Image
              fill
              src={message.attachments[0].image_url}
              alt={message.text || "添付画像"}
              className="object-cover rounded-md"
            />
          </div>
        )}
        {isPDF && message.attachments?.[0]?.asset_url && (
          <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
            <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
            <a
              href={message.attachments[0].asset_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline"
            >
              PDFファイル
            </a>
          </div>
        )}
      </div>
    </div>
  )
} 