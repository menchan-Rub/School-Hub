import { useNavigationStore } from '@/lib/stores/navigation-store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, Settings, User, Bell, Shield, Keyboard, Languages, Gamepad2, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"

interface NavigationItemProps {
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export function NavigationItem({ path, label, icon: Icon }: NavigationItemProps) {
  const { setActiveView } = useNavigationStore()
  
  return (
    <div className="fixed top-4 left-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-4 w-4 text-zinc-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-[#313338] text-zinc-200 border-zinc-700">
          <DropdownMenuItem
            onClick={() => setActiveView('dashboard')}
            className="hover:bg-zinc-700/50"
          >
            <Activity className="w-4 h-4 mr-2" />
            ダッシュボード
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setActiveView('chat')}
            className="hover:bg-zinc-700/50"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            チャット
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-700" />
          <DropdownMenuItem
            onClick={() => setActiveView('settings')}
            className="hover:bg-zinc-700/50"
          >
            <User className="w-4 h-4 mr-2" />
            ユーザー設定
          </DropdownMenuItem>
          <DropdownMenuItem
            className="hover:bg-zinc-700/50"
          >
            <Bell className="w-4 h-4 mr-2" />
            通知設定
          </DropdownMenuItem>
          <DropdownMenuItem
            className="hover:bg-zinc-700/50"
          >
            <Shield className="w-4 h-4 mr-2" />
            プライバシー設定
          </DropdownMenuItem>
          <DropdownMenuItem
            className="hover:bg-zinc-700/50"
          >
            <Keyboard className="w-4 h-4 mr-2" />
            キーボード設定
          </DropdownMenuItem>
          <DropdownMenuItem
            className="hover:bg-zinc-700/50"
          >
            <Languages className="w-4 h-4 mr-2" />
            言語設定
          </DropdownMenuItem>
          <DropdownMenuItem
            className="hover:bg-zinc-700/50"
          >
            <Gamepad2 className="w-4 h-4 mr-2" />
            アクティビティ設定
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 