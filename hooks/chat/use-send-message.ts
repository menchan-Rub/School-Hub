import { useState } from 'react'
import { toast } from 'sonner'

export function useSendMessage() {
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async (content: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      if (!response.ok) throw new Error()
      toast.success('メッセージを送信しました')
    } catch {
      toast.error('メッセージの送信に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    sendMessage,
    isLoading
  }
} 