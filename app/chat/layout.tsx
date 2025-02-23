import { ChatLayout } from "@/components/chat/chat-layout"
import { ChatSidebar } from "@/components/chat/chat-sidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ChatLayout>
      <div className="flex h-full">
        <ChatSidebar />
        <main className="flex-1">{children}</main>
      </div>
    </ChatLayout>
  )
} 