import { useState, useEffect } from 'react'
import { Friend } from '@/lib/types/friend'
import { toast } from 'sonner'

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchFriends()
  }, [])

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/friends')
      const data = await response.json()
      setFriends(data.friends)
      setPendingRequests(data.pendingRequests)
    } catch (error) {
      toast.error('フレンドリストの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const sendFriendRequest = async (userId: string) => {
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      if (!response.ok) throw new Error()
      toast.success('フレンド申請を送信しました')
      await fetchFriends()
    } catch {
      toast.error('フレンド申請の送信に失敗しました')
    }
  }

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/friends/accept/${requestId}`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error()
      toast.success('フレンド申請を承認しました')
      await fetchFriends()
    } catch {
      toast.error('フレンド申請の承認に失敗しました')
    }
  }

  const rejectFriendRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/friends/reject/${requestId}`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error()
      toast.success('フレンド申請を拒否しました')
      await fetchFriends()
    } catch {
      toast.error('フレンド申請の拒否に失敗しました')
    }
  }

  return {
    friends,
    pendingRequests,
    isLoading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest
  }
} 