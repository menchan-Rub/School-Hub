import { useMessages } from '@/hooks/chat/use-messages'
import { UserAvatar } from '@/components/ui/user-avatar'
import { formatDistance } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ScrollArea } from '@/components/ui/scroll-area'

export function MessageList() {
  const { messages } = useMessages()

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map(message => (
          <div key={message.id} className="group flex items-start gap-3 hover:bg-zinc-800/50 p-2 rounded-lg">
            <UserAvatar 
              userId={message.authorId} 
              className="w-8 h-8"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-200">
                  {message.author.name}
                </span>
                <span className="text-xs text-zinc-400">
                  {formatDistance(message.createdAt, new Date(), {
                    addSuffix: true,
                    locale: ja
                  })}
                </span>
              </div>
              <p className="text-zinc-300 break-words">
                {message.content}
              </p>
              {message.attachments?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {message.attachments.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="添付ファイル"
                      className="max-w-xs rounded-lg"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
} 