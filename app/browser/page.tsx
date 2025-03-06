"use client"

import React, { useRef, MutableRefObject } from "react"
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
  iframeRef?: MutableRefObject<HTMLIFrameElement | null>
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
    console.log('Form submitted with URL:', inputUrl)
    if (inputUrl.trim()) {
      onUrlChange(inputUrl.trim())
    }
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
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: '1',
      url: 'https://www.google.com',
      title: 'Google',
      isActive: true,
      iframeRef: React.createRef<HTMLIFrameElement>() as MutableRefObject<HTMLIFrameElement | null>
    }
  ])

  useEffect(() => {
    console.log('BrowserPage mounted')
    return () => {
      console.log('BrowserPage unmounted')
    }
  }, [])

  const addTab = () => {
    const newTab: Tab = {
      id: Math.random().toString(36).substr(2, 9),
      url: 'https://www.google.com',
      title: 'New Tab',
      isActive: true,
      iframeRef: React.createRef<HTMLIFrameElement>() as MutableRefObject<HTMLIFrameElement | null>
    }
    setTabs(prev => [...prev.map(t => ({ ...t, isActive: false })), newTab])
  }

  const removeTab = (tabId: string) => {
    setTabs(prev => prev.filter(t => t.id !== tabId))
  }

  const activateTab = (tabId: string) => {
    setTabs(prev => prev.map(t => ({ ...t, isActive: t.id === tabId })))
  }

  const updateTabUrl = (tabId: string, url: string) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, url } : t))
  }

  const updateTabTitle = (tabId: string, title: string) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, title } : t))
  }

  const getActiveTab = () => {
    return tabs.find(t => t.isActive)
  }

  const handleIframeLoad = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (tab?.iframeRef?.current) {
      try {
        const iframe = tab.iframeRef.current;
        const iframeWindow = iframe.contentWindow;
        
        // タイトルの更新
        if (iframe.contentDocument?.title) {
          updateTabTitle(tabId, iframe.contentDocument.title)
        }

        // カスタムスクリプトの注入
        if (iframeWindow) {
          iframeWindow.addEventListener('keydown', (e) => {
            // Ctrl+F5 でハードリロード
            if (e.ctrlKey && e.key === 'r') {
              e.preventDefault();
              iframe.src = iframe.src;
            }
          });
        }
      } catch (error) {
        console.error('Failed to handle iframe load:', error)
      }
    }
  }

  const handleUrlSubmit = (url: string) => {
    console.log('handleUrlSubmit called with:', url)
    const activeTab = getActiveTab()
    if (activeTab) {
      let processedUrl = url.trim()
      console.log('Processing URL:', processedUrl)

      // 検索クエリの処理
      if (!processedUrl.includes('.') || processedUrl.includes(' ')) {
        processedUrl = `https://www.google.com/search?q=${encodeURIComponent(processedUrl)}`
        console.log('Converted to search URL:', processedUrl)
      } else if (!processedUrl.match(/^https?:\/\//)) {
        processedUrl = `https://${processedUrl}`
        console.log('Added https:', processedUrl)
      }

      console.log('Final URL:', processedUrl)
      updateTabUrl(activeTab.id, processedUrl)

      // iframeを強制的に更新
      const iframe = activeTab.iframeRef?.current
      if (iframe) {
        iframe.src = `/proxy/${processedUrl.replace(/^https?:\/\//, '')}`
      }
    } else {
      console.error('No active tab found')
    }
  }

  return (
    <div className="flex flex-col w-full h-full bg-background">
      <div className="flex items-center justify-between p-2 border-b">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
        >
          ホームに戻る
        </Button>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <BrowserNavigation
          onBack={() => {
            const activeTab = getActiveTab()
            if (activeTab?.iframeRef?.current) {
              try {
                activeTab.iframeRef.current.contentWindow?.history.back()
              } catch (error) {
                console.error('Failed to go back:', error)
              }
            }
          }}
          onForward={() => {
            const activeTab = getActiveTab()
            if (activeTab?.iframeRef?.current) {
              try {
                activeTab.iframeRef.current.contentWindow?.history.forward()
              } catch (error) {
                console.error('Failed to go forward:', error)
              }
            }
          }}
          onRefresh={() => {
            const activeTab = getActiveTab()
            if (activeTab?.iframeRef?.current) {
              try {
                activeTab.iframeRef.current.contentWindow?.location.reload()
              } catch (error) {
                console.error('Failed to refresh:', error)
              }
            }
          }}
          onUrlChange={handleUrlSubmit}
          currentUrl={getActiveTab()?.url || ''}
        />
        <div className="flex items-center p-2 bg-background border-b">
          <div className="flex-grow flex space-x-2 overflow-x-auto">
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={cn(
                  "flex items-center px-4 py-2 rounded-md cursor-pointer transition-colors",
                  tab.isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-secondary/80"
                )}
                onClick={() => activateTab(tab.id)}
              >
                <span className="truncate max-w-[150px]">{tab.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-auto p-0 hover:bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeTab(tab.id)
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
            onClick={addTab}
            className="ml-2"
          >
            +
          </Button>
        </div>
        <div className="flex-1 relative">
          {tabs.map(tab => {
            console.log('Rendering iframe for tab:', tab.url)
            const proxyUrl = tab.url.replace(/^https?:\/\//, '')
            console.log('Proxy URL:', proxyUrl)
            
            return (
              <iframe
                key={tab.id}
                ref={tab.iframeRef}
                src={`/proxy/${proxyUrl}`}
                className={`w-full h-full absolute inset-0 ${tab.isActive ? 'block' : 'hidden'}`}
                onLoad={() => handleIframeLoad(tab.id)}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-presentation"
                loading="lazy"
              />
            )
          })}
        </div>
      </div>
    </div>
  )
} 