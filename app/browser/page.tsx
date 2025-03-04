"use client"

import React, { useRef } from "react"
import { useEffect, useState } from "react"
import SplitPane from "react-split-pane"
import { useRouter } from "next/navigation"
import { IoArrowBack, IoArrowForward, IoRefresh } from "react-icons/io5"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Tab {
  id: string
  url: string
  title: string
  isActive: boolean
  iframeRef?: React.RefObject<HTMLIFrameElement | null>
}

interface CustomSplitPaneProps {
  children: React.ReactNode[]
  split: "horizontal" | "vertical"
  minSize: number
  defaultSize: string | number
}

const CustomSplitPane: React.FC<CustomSplitPaneProps> = ({ children, ...props }) => {
  return (
    <SplitPane {...props}>
      {children}
    </SplitPane>
  )
}

const BrowserNavigation: React.FC<{
  onBack: () => void
  onForward: () => void
  onRefresh: () => void
  onUrlChange: (url: string) => void
  currentUrl: string
}> = ({ onBack, onForward, onRefresh, onUrlChange, currentUrl }) => {
  const [inputUrl, setInputUrl] = useState(currentUrl)

  useEffect(() => {
    setInputUrl(currentUrl)
  }, [currentUrl])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let url = inputUrl
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`
    }
    onUrlChange(url)
  }

  return (
    <div className="flex items-center space-x-2 p-2 bg-background border-b">
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        className="w-8 h-8 p-0"
      >
        <IoArrowBack className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onForward}
        className="w-8 h-8 p-0"
      >
        <IoArrowForward className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        className="w-8 h-8 p-0"
      >
        <IoRefresh className="h-4 w-4" />
      </Button>
      <form onSubmit={handleSubmit} className="flex-grow">
        <Input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="URLを入力"
          className="w-full"
        />
      </form>
    </div>
  )
}

export default function BrowserPage() {
  const router = useRouter()
  const [tabs, setTabs] = useState<Tab[]>([])
  const [splitMode, setSplitMode] = useState<'horizontal' | 'vertical'>('horizontal')
  const [leftTabs, setLeftTabs] = useState<Tab[]>([
    {
      id: '1',
      url: 'https://www.google.com',
      title: 'Google',
      isActive: true,
      iframeRef: React.createRef<HTMLIFrameElement>()
    }
  ])
  const [rightTabs, setRightTabs] = useState<Tab[]>([
    {
      id: '2',
      url: 'https://www.bing.com',
      title: 'Bing',
      isActive: true,
      iframeRef: React.createRef<HTMLIFrameElement>()
    }
  ])

  const addTab = (side: 'left' | 'right') => {
    const newTab: Tab = {
      id: Math.random().toString(36).substr(2, 9),
      url: 'https://www.google.com',
      title: 'New Tab',
      isActive: true,
      iframeRef: React.createRef<HTMLIFrameElement>()
    }

    if (side === 'left') {
      setLeftTabs(prev => [...prev.map(t => ({ ...t, isActive: false })), newTab])
    } else {
      setRightTabs(prev => [...prev.map(t => ({ ...t, isActive: false })), newTab])
    }
  }

  const removeTab = (side: 'left' | 'right', tabId: string) => {
    if (side === 'left') {
      setLeftTabs(prev => prev.filter(t => t.id !== tabId))
    } else {
      setRightTabs(prev => prev.filter(t => t.id !== tabId))
    }
  }

  const activateTab = (side: 'left' | 'right', tabId: string) => {
    if (side === 'left') {
      setLeftTabs(prev => prev.map(t => ({ ...t, isActive: t.id === tabId })))
    } else {
      setRightTabs(prev => prev.map(t => ({ ...t, isActive: t.id === tabId })))
    }
  }

  const updateTabUrl = (side: 'left' | 'right', tabId: string, url: string) => {
    if (side === 'left') {
      setLeftTabs(prev => prev.map(t => t.id === tabId ? { ...t, url } : t))
    } else {
      setRightTabs(prev => prev.map(t => t.id === tabId ? { ...t, url } : t))
    }
  }

  const updateTabTitle = (side: 'left' | 'right', tabId: string, title: string) => {
    if (side === 'left') {
      setLeftTabs(prev => prev.map(t => t.id === tabId ? { ...t, title } : t))
    } else {
      setRightTabs(prev => prev.map(t => t.id === tabId ? { ...t, title } : t))
    }
  }

  const toggleSplitMode = () => {
    setSplitMode(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')
  }

  const getActiveTab = (side: 'left' | 'right') => {
    const tabs = side === 'left' ? leftTabs : rightTabs
    return tabs.find(t => t.isActive)
  }

  const handleIframeLoad = (side: 'left' | 'right', tabId: string) => {
    const tabs = side === 'left' ? leftTabs : rightTabs
    const tab = tabs.find(t => t.id === tabId)
    if (tab?.iframeRef?.current) {
      try {
        const title = tab.iframeRef.current.contentDocument?.title
        if (title) {
          updateTabTitle(side, tabId, title)
        }
      } catch (error) {
        console.error('Failed to get iframe title:', error)
      }
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      <div className="flex items-center justify-between p-2 border-b">
        <Button
          variant="outline"
          onClick={toggleSplitMode}
        >
          {splitMode === 'horizontal' ? '横分割' : '縦分割'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
        >
          ホームに戻る
        </Button>
      </div>

      <div className="flex-grow">
        <CustomSplitPane
          split={splitMode}
          minSize={200}
          defaultSize="50%"
        >
          <div className="h-full flex flex-col">
            <BrowserNavigation
              onBack={() => {
                const activeTab = getActiveTab('left')
                if (activeTab?.iframeRef?.current) {
                  try {
                    activeTab.iframeRef.current.contentWindow?.history.back()
                  } catch (error) {
                    console.error('Failed to go back:', error)
                  }
                }
              }}
              onForward={() => {
                const activeTab = getActiveTab('left')
                if (activeTab?.iframeRef?.current) {
                  try {
                    activeTab.iframeRef.current.contentWindow?.history.forward()
                  } catch (error) {
                    console.error('Failed to go forward:', error)
                  }
                }
              }}
              onRefresh={() => {
                const activeTab = getActiveTab('left')
                if (activeTab?.iframeRef?.current) {
                  try {
                    activeTab.iframeRef.current.contentWindow?.location.reload()
                  } catch (error) {
                    console.error('Failed to refresh:', error)
                  }
                }
              }}
              onUrlChange={(url) => {
                const activeTab = getActiveTab('left')
                if (activeTab) {
                  updateTabUrl('left', activeTab.id, url)
                }
              }}
              currentUrl={getActiveTab('left')?.url || ''}
            />
            <div className="flex items-center p-2 bg-background border-b">
              <div className="flex-grow flex space-x-2 overflow-x-auto">
                {leftTabs.map(tab => (
                  <div
                    key={tab.id}
                    className={cn(
                      "flex items-center px-4 py-2 rounded-md cursor-pointer transition-colors",
                      tab.isActive
                        ? "bg-secondary text-secondary-foreground"
                        : "hover:bg-secondary/80"
                    )}
                    onClick={() => activateTab('left', tab.id)}
                  >
                    <span className="truncate max-w-[150px]">{tab.title}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-auto p-0 hover:bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeTab('left', tab.id)
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addTab('left')}
                className="ml-2"
              >
                +
              </Button>
            </div>
            <div className="flex-grow">
              {leftTabs.map(tab => (
                <iframe
                  key={tab.id}
                  ref={tab.iframeRef}
                  src={tab.url}
                  className={`w-full h-full ${tab.isActive ? 'block' : 'hidden'}`}
                  onLoad={() => handleIframeLoad('left', tab.id)}
                />
              ))}
            </div>
          </div>
          <div className="h-full flex flex-col">
            <BrowserNavigation
              onBack={() => {
                const activeTab = getActiveTab('right')
                if (activeTab?.iframeRef?.current) {
                  try {
                    activeTab.iframeRef.current.contentWindow?.history.back()
                  } catch (error) {
                    console.error('Failed to go back:', error)
                  }
                }
              }}
              onForward={() => {
                const activeTab = getActiveTab('right')
                if (activeTab?.iframeRef?.current) {
                  try {
                    activeTab.iframeRef.current.contentWindow?.history.forward()
                  } catch (error) {
                    console.error('Failed to go forward:', error)
                  }
                }
              }}
              onRefresh={() => {
                const activeTab = getActiveTab('right')
                if (activeTab?.iframeRef?.current) {
                  try {
                    activeTab.iframeRef.current.contentWindow?.location.reload()
                  } catch (error) {
                    console.error('Failed to refresh:', error)
                  }
                }
              }}
              onUrlChange={(url) => {
                const activeTab = getActiveTab('right')
                if (activeTab) {
                  updateTabUrl('right', activeTab.id, url)
                }
              }}
              currentUrl={getActiveTab('right')?.url || ''}
            />
            <div className="flex items-center p-2 bg-background border-b">
              <div className="flex-grow flex space-x-2 overflow-x-auto">
                {rightTabs.map(tab => (
                  <div
                    key={tab.id}
                    className={cn(
                      "flex items-center px-4 py-2 rounded-md cursor-pointer transition-colors",
                      tab.isActive
                        ? "bg-secondary text-secondary-foreground"
                        : "hover:bg-secondary/80"
                    )}
                    onClick={() => activateTab('right', tab.id)}
                  >
                    <span className="truncate max-w-[150px]">{tab.title}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-auto p-0 hover:bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeTab('right', tab.id)
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addTab('right')}
                className="ml-2"
              >
                +
              </Button>
            </div>
            <div className="flex-grow">
              {rightTabs.map(tab => (
                <iframe
                  key={tab.id}
                  ref={tab.iframeRef}
                  src={tab.url}
                  className={`w-full h-full ${tab.isActive ? 'block' : 'hidden'}`}
                  onLoad={() => handleIframeLoad('right', tab.id)}
                />
              ))}
            </div>
          </div>
        </CustomSplitPane>
      </div>
    </div>
  )
} 