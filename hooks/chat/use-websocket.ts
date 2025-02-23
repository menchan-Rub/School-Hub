import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useChatStore } from '@/lib/chat/store'

export function useWebSocket() {
  const socketRef = useRef<Socket>()
  const { activeChannel, addMessage } = useChatStore()

  useEffect(() => {
    socketRef.current = io({
      path: '/api/socket',
    })

    socketRef.current.on('new-message', (message) => {
      addMessage(message)
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [])

  useEffect(() => {
    if (activeChannel) {
      socketRef.current?.emit('join-channel', activeChannel.id)
    }
  }, [activeChannel?.id])

  return socketRef.current
} 