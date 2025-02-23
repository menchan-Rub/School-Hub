import { useState, useEffect } from 'react'
import { Message } from '@/lib/types/chat'
import { toast } from 'sonner'

export function useMessages(channelId?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (channelId) {
      fetchMessages()
    }
  }, [channelId])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/channels/${channelId}/messages`)
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      toast.error('メッセージの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    messages,
    isLoading
  }
} 