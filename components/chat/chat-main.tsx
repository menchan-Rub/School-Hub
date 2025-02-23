"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { Channel, Message } from "stream-chat"
import { MessageList, MessageInput, Window } from "stream-chat-react"
import { useChatContext } from "stream-chat-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Paperclip, Send, Smile } from "lucide-react"
import { EmojiPicker } from "@/components/chat/emoji-picker"
import { FileUpload } from "@/components/chat/file-upload"
import { MessageActions } from "@/components/chat/message-actions"

export function ChatMain() {
  const params = useParams()
  const { client, channel: activeChannel } = useChatContext()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [content, setContent] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?channelId=${params.channelId}`)
        if (!response.ok) throw new Error("Failed to fetch messages")
        const data = await response.json()
        setMessages(data)
      } catch (error) {
        console.error("Error fetching messages:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.channelId) {
      fetchMessages()
    }
  }, [params.channelId])

  const handleSendMessage = async () => {
    if (!content.trim()) return

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: params.channelId,
          content,
        }),
      })
      setContent("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleFileUpload = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("channelId", params.channelId as string)

    try {
      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      })
      if (!response.ok) throw new Error("Failed to upload file")
    } catch (error) {
      console.error("Error uploading file:", error)
    }
  }

  if (isLoading || !activeChannel) {
    return <LoadingSpinner />
  }

  return (
    <div className="flex flex-col h-full bg-[#313338]">
      <Window>
        <div className="flex items-center h-12 px-4 border-b border-gray-800">
          <h3 className="font-semibold text-white">
            # {activeChannel.data?.name || "general"}
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          <MessageList 
            messages={messages}
            Message={CustomMessage}
          />
        </div>
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <EmojiPicker
              onChange={(emoji) => setContent(prev => prev + emoji)}
            />
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="メッセージを入力..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
            <Button onClick={handleSendMessage}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file)
            }}
          />
        </div>
      </Window>
    </div>
  )
}

function CustomMessage({ message }: { message: Message }) {
  return (
    <div className="group relative flex items-start gap-2 p-2 hover:bg-gray-800/50">
      <img
        src={message.user?.image || "/placeholder.svg"}
        alt={message.user?.name || "User"}
        className="h-10 w-10 rounded-full"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">
            {message.user?.name || "Unknown User"}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(message.created_at!).toLocaleString()}
          </span>
        </div>
        <p className="text-gray-300">{message.text}</p>
        {message.attachments?.map((attachment, i) => (
          <FileUpload key={i} attachment={attachment} />
        ))}
      </div>
      <MessageActions message={message} />
    </div>
  )
} 