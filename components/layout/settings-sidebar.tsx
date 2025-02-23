"use client"

import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Languages, 
  Home,
  BarChart3,
  Beaker
} from "lucide-react"

const routes = [
  {
    label: "一般",
    icon: Settings,
    items: [
      {
        label: "ホーム",
        icon: Home,
        href: "/",
      },
      {
        label: "アカウント",
        icon: User,
        href: "/settings/account",
      },
      {
        label: "通知",
        icon: Bell,
        href: "/settings/notifications",
      },
    ],
  },
  {
    label: "モデル",
    icon: BarChart3,
    items: [
      {
        label: "モデル設定",
        icon: Settings,
        href: "/settings/models",
      },
    ],
  },
  {
    label: "機能",
    icon: Beaker,
    items: [
      {
        label: "プライバシー",
        icon: Shield,
        href: "/settings/privacy",
      },
      {
        label: "表示",
        icon: Palette,
        href: "/settings/appearance",
      },
      {
        label: "言語",
        icon: Languages,
        href: "/settings/language",
      },
    ],
  },
]

export function SettingsSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="space-y-4 flex flex-col h-full w-[240px] dark:bg-[#2B2D31] bg-[#F2F3F5] p-3">
      <ScrollArea className="flex-1 w-full">
        <div className="space-y-6">
          {routes.map((section) => (
            <div key={section.label}>
              <h4 className="flex items-center text-xs font-semibold text-muted-foreground mb-2">
                <section.icon className="h-4 w-4 mr-2" />
                {section.label}
              </h4>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={cn(
                      "w-full font-normal justify-start pl-8",
                      pathname === item.href && "bg-zinc-200 dark:bg-zinc-700"
                    )}
                    onClick={() => router.push(item.href)}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
} 