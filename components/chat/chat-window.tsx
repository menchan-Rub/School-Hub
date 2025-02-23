import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ServerList } from './ServerList'
import { ChannelList } from './ChannelList'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { Channel } from '@/lib/types'
import { toast } from 'sonner'

export function ChatWindow({ onBack }: { onBack: () => void }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannelId, setActiveChannelId] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 未認証の場合のみリダイレクト
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    // 認証済みの場合はチャンネル取得
    if (status === 'authenticated' && session?.user) {
      fetchChannels()
    }
  }, [status, session])

  const fetchChannels = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/channels')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 401) {
          toast.error('セッションが切れました')
          router.push('/login')
          return
        }
        throw new Error(errorData.error || `サーバーエラー (${response.status})`)
      }

      const data = await response.json()
      setChannels(data.channels || [])
    } catch (error) {
      console.error('Failed to fetch channels:', error)
      toast.error(error instanceof Error ? error.message : 'チャンネルの取得に失敗しました')
      setChannels([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen flex">
      {/* サーバーリスト - Discord風の左サイドバー */}
      <div className="w-[72px] h-full bg-[#E3E5E8] dark:bg-[#1E1F22] flex flex-col items-center py-3 space-y-2">
        <ServerList />
      </div>

      {/* チャンネルリスト - Discord風の左メインサイドバー */}
      <div className="w-60 bg-[#F2F3F5] dark:bg-[#2B2D31] flex flex-col">
        <div className="h-12 px-4 border-b border-[#E5E5E5] dark:border-[#1F1F1F] flex items-center">
          <h2 className="font-semibold text-[#060607] dark:text-white">サーバー名</h2>
        </div>
        <ChannelList
          channels={channels}
          isLoading={isLoading}
          onChannelSelect={setActiveChannelId}
        />
      </div>

      {/* メインチャット画面 */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#313338]">
        {/* チャンネルヘッダー */}
        <div className="h-12 px-4 border-b border-[#E5E5E5] dark:border-[#1F1F1F] flex items-center">
          <span className="text-[#060607] dark:text-white font-semibold">
            # {activeChannelId 
              ? channels.find(c => c.id === activeChannelId)?.name 
              : 'チャンネルを選択'
            }
          </span>
        </div>

        {/* メッセージエリア */}
        <div className="flex-1 overflow-y-auto">
          <MessageList channelId={activeChannelId} />
        </div>

        {/* メッセージ入力 */}
        <div className="p-4 mx-4 mb-4">
          <div className="relative">
            <ChatInput 
              channelId={activeChannelId}
              className="w-full px-4 py-2.5 bg-[#EBEDEF] dark:bg-[#383A40] rounded-lg
                text-[#2E3338] dark:text-[#DCDDDE] 
                placeholder-[#6A7480] dark:placeholder-[#6C6E72]
                border-none focus:ring-2 focus:ring-[#00A8FC] dark:focus:ring-[#00A8FC]"
              placeholder={`#${channels.find(c => c.id === activeChannelId)?.name || 'チャンネル'}でメッセージを送信`}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 