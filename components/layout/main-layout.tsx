"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Menu, Home, MessageSquare, Settings, Users, Globe } from "lucide-react"
import { useNavigationStore } from '@/lib/stores/navigation-store'
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const { setActiveView } = useNavigationStore()
  const [isOpen, setIsOpen] = useState(false)

  if (status === "unauthenticated") {
    redirect("/login")
  }

  const menuItems = [
    { icon: Home, label: "ダッシュボード", view: "dashboard" },
    { icon: MessageSquare, label: "チャット", view: "chat" },
    { icon: Users, label: "フレンド", view: "friends" },
    { icon: Globe, label: "ブラウザ", view: "browser" },
    { icon: Settings, label: "設定", view: "settings" },
  ]

  const handleViewChange = (view: string) => {
    setActiveView(view)
    setIsOpen(false)
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* メニュー用の固定幅スペース */}
      <div className="w-16 shrink-0">
        <div className="fixed top-0 left-0 z-[100] p-4">
          <motion.button
            className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-colors duration-300 shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center"
            onClick={() => setIsOpen(!isOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="w-6 h-5 flex flex-col justify-between"
              animate={isOpen ? "open" : "closed"}
            >
              <motion.span
                className="w-6 h-0.5 bg-white rounded-full origin-left"
                variants={{
                  open: { rotate: 45, y: 0 },
                  closed: { rotate: 0, y: 0 }
                }}
                transition={{ duration: 0.3 }}
              />
              <motion.span
                className="w-6 h-0.5 bg-white rounded-full"
                variants={{
                  open: { opacity: 0 },
                  closed: { opacity: 1 }
                }}
                transition={{ duration: 0.3 }}
              />
              <motion.span
                className="w-6 h-0.5 bg-white rounded-full origin-left"
                variants={{
                  open: { rotate: -45, y: 0 },
                  closed: { rotate: 0, y: 0 }
                }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {isOpen && (
              <>
                <motion.div
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsOpen(false)}
                />
                <motion.div
                  className="absolute left-0 top-16 z-[95] bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 w-64 border border-gray-200 dark:border-gray-700"
                  initial={{ opacity: 0, x: -20, y: 0 }}
                  animate={{ opacity: 1, x: 4, y: 0 }}
                  exit={{ opacity: 0, x: -20, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-2">
                    {menuItems.map((item) => (
                      <motion.button
                        key={item.view}
                        onClick={() => handleViewChange(item.view)}
                        className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <item.icon className="w-5 h-5 text-indigo-500" />
                        <span className="font-medium">{item.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}

