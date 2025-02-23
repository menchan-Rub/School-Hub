import { useState } from 'react'
import { Channel } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Hash, Volume2, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface ChannelListProps {
  channels?: Channel[]
  activeChannelId?: string
  onChannelSelect: (channelId: string) => void
  isLoading?: boolean
}

export function ChannelList({ 
  channels = [],
  activeChannelId, 
  onChannelSelect,
  isLoading = false
}: ChannelListProps) {
  return (
    <ScrollArea className="h-full w-64 border-r border-border">
      <div className="p-4 border-b">
        <h2 className="font-semibold">チャンネル一覧</h2>
      </div>
      <div className="p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : channels.length > 0 ? (
          <div className="space-y-1">
            {channels.map(channel => (
              <Button
                key={channel.id}
                variant="ghost"
                className={cn(
                  'w-full justify-start',
                  activeChannelId === channel.id && 'bg-accent'
                )}
                onClick={() => onChannelSelect(channel.id)}
              >
                {channel.type === 'text' ? (
                  <Hash className="mr-2 h-4 w-4" />
                ) : (
                  <Volume2 className="mr-2 h-4 w-4" />
                )}
                <span className="truncate">{channel.name}</span>
                {channel.isPrivate && (
                  <Lock className="ml-auto h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            ))}
          </div>
        ) : (
          <div className="px-2 py-8 text-center text-sm text-muted-foreground">
            チャンネルがありません
          </div>
        )}
      </div>
    </ScrollArea>
  )
} 