import { NavigationSidebar } from "@/components/chat/navigation-sidebar"
import { ChatProvider } from "@/providers/chat-provider"

export default function ChatLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ChatProvider>
      <div className="h-full">
        <div className="hidden md:flex h-full w-[72px] z-30 flex-col fixed inset-y-0">
          <NavigationSidebar />
        </div>
        <main className="md:pl-[72px] h-full">
          {children}
        </main>
      </div>
    </ChatProvider>
  )
} 