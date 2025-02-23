import { useState, useEffect } from 'react'
import { Channel } from '@/lib/types/chat'
import { toast } from 'sonner'

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchChannels()
  }, [])

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/channels')
      const data = await response.json()
      setChannels(data)
      if (data.length > 0) {
        setActiveChannel(data[0])
      }
    } catch (error) {
      toast.error('チャンネルの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const createChannel = async (name: string, type: 'TEXT' | 'VOICE') => {
    try {
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type })
      })
      const newChannel = await response.json()
      setChannels(prev => [...prev, newChannel])
      toast.success('チャンネルを作成しました')
    } catch {
      toast.error('チャンネルの作成に失敗しました')
    }
  }

  return {
    channels,
    activeChannel,
    isLoading,
    setActiveChannel,
    createChannel
  }
} 