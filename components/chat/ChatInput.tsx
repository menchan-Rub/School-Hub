import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Paperclip, Send, Smile } from 'lucide-react'
import { useSendMessage } from '@/hooks/chat/use-send-message'

export function ChatInput() {
  const [message, setMessage] = useState('')
  const { sendMessage, isLoading } = useSendMessage()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    
    sendMessage(message)
    setMessage('')
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-zinc-800/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 bg-zinc-700/50 rounded-lg p-2">
        <Button 
          type="button" 
          variant="ghost" 
          size="icon"
          className="text-zinc-400 hover:text-white"
        >
          <Paperclip className="w-5 h-5" />
        </Button>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="メッセージを入力..."
          className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-200 placeholder:text-zinc-400"
        />
        <Button 
          type="button" 
          variant="ghost" 
          size="icon"
          className="text-zinc-400 hover:text-white"
        >
          <Smile className="w-5 h-5" />
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="bg-indigo-500 hover:bg-indigo-600 text-white"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </form>
  )
} 