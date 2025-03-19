"use client"

import React, { useRef, MutableRefObject, useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { LoginForm } from "./components/auth/LoginForm"
import { UserDashboard } from "@/components/dashboard/user-dashboard"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { UserManagementSection } from "@/components/dashboard/admin/user-management-section"
import { ServerMonitoringSection } from "@/components/dashboard/admin/server-monitoring-section"
import { SecuritySection } from "@/components/dashboard/admin/security-section"
import { SettingsSection } from "@/components/dashboard/admin/settings-section"
import { useNavigationStore } from "@/lib/stores/navigation-store"
import { AdminNav } from "@/components/admin/nav"
import { useQuery } from "@tanstack/react-query"
import { AdminStats } from "@/lib/types"
import SplitPane from "react-split-pane"
import { useRouter } from "next/navigation"
import { 
  IoArrowBack, 
  IoArrowForward, 
  IoRefresh, 
  IoClose, 
  IoAdd, 
  IoHome,
  IoBookmark,
  IoSettings,
  IoSearch,
  IoMenu,
  IoShield,
  IoWarning,
  IoEllipsisVertical,
  IoDownload,
  IoPrint
} from "react-icons/io5"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"

// ブラウザ用の型定義
interface Tab {
  id: string
  url: string
  title: string
  isActive: boolean
  iframeRef?: MutableRefObject<HTMLIFrameElement | null>
  history: string[]  // 履歴の追加
  historyIndex: number  // 履歴インデックス
  favicon?: string  // ファビコンURL
  isLoading: boolean  // ロード状態
  error?: string  // エラー情報を保存
  incognito?: boolean  // シークレットモード
  zoom?: number  // ズームレベル
}

// 検索エンジン定義
interface SearchEngine {
  name: string;
  url: string;
  icon?: string;
}

const searchEngines: SearchEngine[] = [
  { name: 'Google', url: 'https://www.google.com/search?q=%s' },
  { name: 'Bing', url: 'https://www.bing.com/search?q=%s' },
  { name: 'Yahoo', url: 'https://search.yahoo.com/search?p=%s' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s' }
];

// 安全でないURLをチェックする関数
const isUrlSafe = (url: string): boolean => {
  // 許可されていないプロトコルをブロック
  if (url.match(/^(javascript|data|file|vbscript|about):/i)) {
    return false;
  }
  
  // 悪意のあるドメインのブラックリスト（実際の実装ではより包括的なリストが必要）
  const blacklistedDomains = [
    'malware.example.com',
    'phishing.example.org'
  ];
  
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return !blacklistedDomains.includes(urlObj.hostname);
  } catch (e) {
    return true; // URLの解析に失敗した場合は検索クエリとして扱うので許可
  }
};

// URLを正規化する関数
const normalizeUrl = (url: string): string => {
  let processedUrl = url.trim();
  
  // 検索クエリの処理
  if (!processedUrl.includes('.') || processedUrl.includes(' ')) {
    return `https://www.google.com/search?q=${encodeURIComponent(processedUrl)}`;
  }
  
  // プロトコルの追加
  if (!processedUrl.match(/^https?:\/\//)) {
    processedUrl = `https://${processedUrl}`;
  }
  
  return processedUrl;
};

// ブラウザナビゲーションコンポーネント
const BrowserNavigation: React.FC<{
  onBack: () => void
  onForward: () => void
  onRefresh: () => void
  onUrlChange: (url: string) => void
  currentUrl: string
  onHomeClick: () => void
  isLoading?: boolean
  canGoBack?: boolean
  canGoForward?: boolean
  securityInfo?: { secure: boolean; certificate?: string }
  onToggleBookmarks: () => void
  defaultSearchEngine: SearchEngine
  onOpenSettings: () => void
  onOpenDownloads: () => void
  zoom: number
  onZoomChange: (zoom: number) => void
}> = ({ 
  onBack, 
  onForward, 
  onRefresh, 
  onUrlChange, 
  currentUrl, 
  onHomeClick,
  isLoading = false,
  canGoBack = false,
  canGoForward = false,
  securityInfo = { secure: true },
  onToggleBookmarks,
  defaultSearchEngine,
  onOpenSettings,
  onOpenDownloads,
  zoom = 100,
  onZoomChange
}) => {
  const [inputUrl, setInputUrl] = useState(currentUrl)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isFocused) {
      setInputUrl(currentUrl)
    }
  }, [currentUrl, isFocused])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputUrl.trim()) {
      onUrlChange(inputUrl.trim())
    }
  }

  const getDomainFromUrl = (url: string): string => {
    try {
      const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsedUrl.hostname;
    } catch (e) {
      return '';
    }
  }

  const domain = getDomainFromUrl(currentUrl);

  return (
    <div className="flex flex-col bg-[#f1f3f4] dark:bg-[#202124] border-b border-gray-200 dark:border-gray-700">
      {/* ブラウザコントロール */}
      <div className="flex items-center h-9 px-2 space-x-1">
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            disabled={!canGoBack}
          >
            <IoArrowBack className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onForward}
            className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            disabled={!canGoForward}
          >
            <IoArrowForward className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            disabled={isLoading}
          >
            <IoRefresh className={cn("h-4 w-4 text-gray-700 dark:text-gray-300", isLoading && "animate-spin")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onHomeClick}
            className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <IoHome className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          </Button>
        </div>
        
        {/* Chrome風アドレスバー */}
        <div className={cn(
          "flex-1 relative mx-2 rounded-full overflow-hidden transition-all",
          isFocused ? "bg-white dark:bg-gray-800 ring-2 ring-blue-500" : "bg-[#e4e7eb] dark:bg-[#303134]"
        )}>
          <form onSubmit={handleSubmit} className="flex items-center w-full">
            {/* セキュリティアイコン */}
            <div 
              className="flex items-center justify-center h-8 px-2"
              title={securityInfo.secure ? "この接続は保護されています" : "この接続は保護されていません"}
            >
              {securityInfo.secure ? (
                <IoShield className="h-4 w-4 text-green-600" />
              ) : (
                <IoWarning className="h-4 w-4 text-amber-500" />
              )}
            </div>
            
            {/* URLまたは検索語入力 */}
            <div className="flex-1 relative">
              {!isFocused && domain ? (
                <div className="absolute inset-y-0 left-0 flex items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{domain}</span>
                </div>
              ) : null}
              <Input
                ref={inputRef}
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onFocus={() => {
                  setIsFocused(true);
                  inputRef.current?.select();
                }}
                onBlur={() => setIsFocused(false)}
                placeholder={`${defaultSearchEngine.name}で検索、またはURLを入力`}
                className="border-none shadow-none h-8 bg-transparent focus:ring-0 pl-0"
              />
            </div>
            
            {/* ローディングインジケーター */}
            {isLoading && (
              <div className="mr-2">
                <div className="h-4 w-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
          </form>
        </div>
        
        {/* 右側のアクション */}
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleBookmarks}
            className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            title="ブックマーク"
          >
            <IoBookmark className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenDownloads}
            className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            title="ダウンロード"
          >
            <IoDownload className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          </Button>
          
          {/* 設定メニュー */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <IoEllipsisVertical className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => window.print()}>
                <IoPrint className="mr-2 h-4 w-4" />
                <span>印刷</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>ズーム</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onZoomChange(Math.max(25, zoom - 10))}>
                縮小
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                {zoom}%
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onZoomChange(Math.min(300, zoom + 10))}>
                拡大
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={onOpenSettings}>
                <IoSettings className="mr-2 h-4 w-4" />
                <span>設定</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

// ブラウザコンポーネント
const BrowserComponent: React.FC<{
  onHomeClick: () => void
}> = ({ onHomeClick }) => {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: '1',
      url: 'https://www.google.com',
      title: 'Google',
      isActive: true,
      iframeRef: React.createRef<HTMLIFrameElement>() as MutableRefObject<HTMLIFrameElement | null>,
      history: ['https://www.google.com'],
      historyIndex: 0,
      isLoading: false,
      zoom: 100
    }
  ])
  
  // ブラウザのローカルストレージからブックマークを取得
  const [bookmarks, setBookmarks] = useState<{ title: string; url: string; favicon?: string }[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);
  const [defaultSearchEngine, setDefaultSearchEngine] = useState<SearchEngine>(searchEngines[0]);
  
  // ブラウザ使用統計の追跡
  const [stats, setStats] = useState({
    pagesVisited: 0,
    timeSpent: 0,
    blockedContent: 0,
    downloads: 0
  });

  // ドラッグ関連の状態
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  
  // 統計情報の定期更新
  useEffect(() => {
    const timer = setInterval(() => {
      setStats(prev => ({...prev, timeSpent: prev.timeSpent + 1}));
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    console.log('BrowserComponent mounted')
    
    // ローカルストレージからデータを読み込む
    try {
      // ブックマーク
      const savedBookmarks = localStorage.getItem('browser_bookmarks');
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }
      
      // 検索エンジン
      const savedSearchEngine = localStorage.getItem('default_search_engine');
      if (savedSearchEngine) {
        const engine = searchEngines.find(e => e.name === savedSearchEngine);
        if (engine) setDefaultSearchEngine(engine);
      }
      
      // 最後に開いていたタブ
      const savedTabs = localStorage.getItem('browser_tabs');
      if (savedTabs) {
        try {
          const parsedTabs = JSON.parse(savedTabs) as Omit<Tab, 'iframeRef'>[];
          setTabs(parsedTabs.map(tab => ({
            ...tab,
            iframeRef: React.createRef<HTMLIFrameElement>() as MutableRefObject<HTMLIFrameElement | null>,
          })));
        } catch (e) {
          console.error('タブの復元に失敗しました:', e);
        }
      }
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
    }
    
    // キーボードショートカットの登録
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+T: 新しいタブ
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        addTab();
      }
      
      // Ctrl+W: タブを閉じる
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        const activeTab = getActiveTab();
        if (activeTab) removeTab(activeTab.id);
      }
      
      // Ctrl+Tab: 次のタブ
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        switchToNextTab();
      }
      
      // Shift+Ctrl+Tab: 前のタブ
      if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
        e.preventDefault();
        switchToPrevTab();
      }
      
      // Ctrl+1~8: 特定のタブに切り替え
      if (e.ctrlKey && /^[1-8]$/.test(e.key)) {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (tabs[index]) {
          activateTab(tabs[index].id);
        }
      }
      
      // Ctrl+9: 最後のタブに切り替え
      if (e.ctrlKey && e.key === '9') {
        e.preventDefault();
        if (tabs.length > 0) {
          activateTab(tabs[tabs.length - 1].id);
        }
      }
      
      // Ctrl+Shift+I: 開発者ツールを開く
      if (e.ctrlKey && e.shiftKey && e.key === 'i') {
        e.preventDefault();
        openDevTools();
      }
      
      // F12: 開発者ツールを開く
      if (e.key === 'F12') {
        e.preventDefault();
        openDevTools();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      console.log('BrowserComponent unmounted')
      window.removeEventListener('keydown', handleKeyDown);
      
      // タブ情報を保存
      try {
        const tabsToSave = tabs.map(({ iframeRef, ...rest }) => rest);
        localStorage.setItem('browser_tabs', JSON.stringify(tabsToSave));
      } catch (e) {
        console.error('タブの保存に失敗しました:', e);
      }
    }
  }, [])
  
  // タブ状態の変更時にローカルストレージに保存
  useEffect(() => {
    try {
      const tabsToSave = tabs.map(({ iframeRef, ...rest }) => rest);
      localStorage.setItem('browser_tabs', JSON.stringify(tabsToSave));
    } catch (e) {
      console.error('タブの保存に失敗しました:', e);
    }
  }, [tabs]);

  const addTab = () => {
    const newTab: Tab = {
      id: Math.random().toString(36).substr(2, 9),
      url: 'https://www.google.com',
      title: '新しいタブ',
      isActive: true,
      iframeRef: React.createRef<HTMLIFrameElement>() as MutableRefObject<HTMLIFrameElement | null>,
      history: ['https://www.google.com'],
      historyIndex: 0,
      isLoading: false,
      zoom: 100
    }
    setTabs(prev => [...prev.map(t => ({ ...t, isActive: false })), newTab])
  }

  const removeTab = (tabId: string) => {
    // タブを削除する前に、最後のタブかどうかをチェック
    setTabs(prev => {
      if (prev.length <= 1) {
        // 最後のタブの場合は新しいタブを作成
        return [{
          id: Math.random().toString(36).substr(2, 9),
          url: 'https://www.google.com',
          title: '新しいタブ',
          isActive: true,
          iframeRef: React.createRef<HTMLIFrameElement>() as MutableRefObject<HTMLIFrameElement | null>,
          history: ['https://www.google.com'],
          historyIndex: 0,
          isLoading: false,
          zoom: 100
        }];
      }
      
      const filtered = prev.filter(t => t.id !== tabId);
      const wasActive = prev.find(t => t.id === tabId)?.isActive || false;
      
      // 削除したタブがアクティブだった場合、別のタブをアクティブにする
      if (wasActive && filtered.length > 0) {
        const newActiveIndex = Math.min(
          prev.findIndex(t => t.id === tabId),
          filtered.length - 1
        );
        filtered[newActiveIndex].isActive = true;
      }
      
      return filtered;
    });
  }

  const activateTab = (tabId: string) => {
    setTabs(prev => prev.map(t => ({ ...t, isActive: t.id === tabId })))
  }
  
  const switchToNextTab = () => {
    setTabs(prev => {
      const activeIndex = prev.findIndex(t => t.isActive);
      const nextIndex = activeIndex < prev.length - 1 ? activeIndex + 1 : 0;
      return prev.map((t, i) => ({ ...t, isActive: i === nextIndex }));
    });
  };

  const switchToPrevTab = () => {
    setTabs(prev => {
      const activeIndex = prev.findIndex(t => t.isActive);
      const prevIndex = activeIndex > 0 ? activeIndex - 1 : prev.length - 1;
      return prev.map((t, i) => ({ ...t, isActive: i === prevIndex }));
    });
  };

  const updateTabUrl = (tabId: string, url: string) => {
    setTabs(prev => prev.map(t => {
      if (t.id === tabId) {
        // 履歴に追加して更新
        const newHistory = [...t.history.slice(0, t.historyIndex + 1), url];
        return { 
          ...t, 
          url,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          isLoading: true,
          error: undefined // エラーをリセット
        };
      }
      return t;
    }));
    
    // 統計を更新
    setStats(prev => ({...prev, pagesVisited: prev.pagesVisited + 1}));
  }

  const updateTabTitle = (tabId: string, title: string) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, title } : t))
  }
  
  const updateTabFavicon = (tabId: string, favicon?: string) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, favicon } : t));
  }
  
  const updateTabZoom = (tabId: string, zoom: number) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, zoom } : t));
  }

  const getActiveTab = () => {
    return tabs.find(t => t.isActive);
  }
  
  const handleTabNavigation = (direction: 'back' | 'forward') => {
    const activeTab = getActiveTab();
    if (!activeTab) return;
    
    setTabs(prev => prev.map(t => {
      if (t.id === activeTab.id) {
        const newIndex = direction === 'back' 
          ? Math.max(0, t.historyIndex - 1)
          : Math.min(t.history.length - 1, t.historyIndex + 1);
          
        if (newIndex === t.historyIndex) return t;
        
        return {
          ...t,
          url: t.history[newIndex],
          historyIndex: newIndex,
          isLoading: true,
          error: undefined
        };
      }
      return t;
    }));
  }
  
  const canGoBack = () => {
    const activeTab = getActiveTab();
    return activeTab ? activeTab.historyIndex > 0 : false;
  }
  
  const canGoForward = () => {
    const activeTab = getActiveTab();
    return activeTab ? activeTab.historyIndex < activeTab.history.length - 1 : false;
  }

  const handleIframeLoad = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.iframeRef?.current) {
      try {
        const iframe = tab.iframeRef.current;
        const iframeWindow = iframe.contentWindow;
        const iframeDocument = iframe.contentDocument;
        
        // ロード完了をマーク
        setTabs(prev => prev.map(t => 
          t.id === tabId ? { ...t, isLoading: false } : t
        ));
        
        // タイトルの更新
        if (iframeDocument?.title) {
          updateTabTitle(tabId, iframeDocument.title);
        }
        
        // ファビコンの取得と更新
        const faviconLink = iframeDocument?.querySelector('link[rel="icon"], link[rel="shortcut icon"]') as HTMLLinkElement;
        if (faviconLink?.href) {
          updateTabFavicon(tabId, faviconLink.href);
        } else {
          // デフォルトのファビコンを試す
          try {
            const host = new URL(tab.url).host;
            updateTabFavicon(tabId, `https://${host}/favicon.ico`);
          } catch (e) {
            updateTabFavicon(tabId, undefined);
          }
        }

        // カスタムスクリプトの注入
        if (iframeWindow && iframeDocument) {
          // クリックイベントの追跡
          iframeDocument.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'A') {
              e.preventDefault();
              const link = target as HTMLAnchorElement;
              const targetUrl = link.href;
              
              // 新しいタブで開くかどうかの確認
              if (link.target === '_blank') {
                // 新しいタブを作成して、そのURLを設定
                const newTab: Tab = {
                  id: Math.random().toString(36).substr(2, 9),
                  url: targetUrl,
                  title: 'Loading...',
                  isActive: true,
                  iframeRef: React.createRef<HTMLIFrameElement>() as MutableRefObject<HTMLIFrameElement | null>,
                  history: [targetUrl],
                  historyIndex: 0,
                  isLoading: true,
                  zoom: 100
                };
                setTabs(prev => [...prev.map(t => ({ ...t, isActive: false })), newTab]);
              } else {
                // 現在のタブでURLを更新
                handleUrlSubmit(targetUrl);
              }
            }
          }, true);
          
          // ズーム適用
          if (tab.zoom && tab.zoom !== 100) {
            try {
              (iframeDocument.body.style as any).zoom = `${tab.zoom}%`;
            } catch (e) {
              console.error('ズームの適用に失敗しました:', e);
            }
          }
          
          // キーボードショートカットの追加
          iframeWindow.addEventListener('keydown', (e) => {
            // Ctrl+F5 でハードリロード
            if (e.ctrlKey && e.key === 'r') {
              e.preventDefault();
              iframe.src = iframe.src;
            }
            
            // Ctrl+D でブックマーク追加
            if (e.ctrlKey && e.key === 'd') {
              e.preventDefault();
              addBookmark(tab.url, tab.title, tab.favicon);
            }
          });
          
          // ダウンロードリンクの追跡
          iframeDocument.querySelectorAll('a[download]').forEach(link => {
            link.addEventListener('click', () => {
              setStats(prev => ({...prev, downloads: prev.downloads + 1}));
            });
          });
        }
        
        // セキュリティ対策: 不要なスクリプトや悪意のあるコンテンツをブロック
        const scripts = iframeDocument?.querySelectorAll('script[src*="ad"], script[src*="track"], iframe[src*="ad"]');
        if (scripts && scripts.length > 0) {
          scripts.forEach(script => script.remove());
          setStats(prev => ({...prev, blockedContent: prev.blockedContent + scripts.length}));
        }
      } catch (error) {
        console.error('Failed to handle iframe load:', error);
        // エラー状態を更新
        setTabs(prev => prev.map(t => 
          t.id === tabId ? { ...t, isLoading: false, error: 'ページの読み込み中にエラーが発生しました' } : t
        ));
      }
    }
  }
  
  // エラー発生時のハンドリング
  const handleIframeError = (tabId: string, error: string) => {
    setTabs(prev => prev.map(t => 
      t.id === tabId ? { ...t, isLoading: false, error } : t
    ));
  }
  
  // ブックマーク機能
  const addBookmark = (url: string, title: string, favicon?: string) => {
    setBookmarks(prev => {
      // 同じURLが既に存在するか確認
      if (prev.some(b => b.url === url)) {
        return prev;
      }
      
      const newBookmarks = [...prev, { url, title, favicon }];
      try {
        localStorage.setItem('browser_bookmarks', JSON.stringify(newBookmarks));
      } catch (error) {
        console.error('Failed to save bookmark:', error);
      }
      return newBookmarks;
    });
  }
  
  const removeBookmark = (url: string) => {
    setBookmarks(prev => {
      const newBookmarks = prev.filter(b => b.url !== url);
      try {
        localStorage.setItem('browser_bookmarks', JSON.stringify(newBookmarks));
      } catch (error) {
        console.error('Failed to remove bookmark:', error);
      }
      return newBookmarks;
    });
  }

  const handleUrlSubmit = (url: string) => {
    console.log('URL送信:', url);
    const activeTab = getActiveTab();
    
    if (activeTab) {
      try {
        // URLの安全性チェック
        if (!isUrlSafe(url)) {
          handleIframeError(activeTab.id, '安全でないURLが検出されました。アクセスがブロックされました。');
          return;
        }
        
        // URLの正規化
        const processedUrl = normalizeUrl(url);
        console.log('最終URL:', processedUrl);
        
        // タブのURLを更新
        updateTabUrl(activeTab.id, processedUrl);
        
        // iframeを更新
        const iframe = activeTab.iframeRef?.current;
        if (iframe) {
          // プロキシを通してロード
          iframe.src = `/api/proxy/${processedUrl.replace(/^https?:\/\//, '')}`;
        }
      } catch (error) {
        console.error('URL処理中のエラー:', error);
        handleIframeError(activeTab.id, 'URLの処理中にエラーが発生しました');
      }
    } else {
      console.error('アクティブなタブが見つかりません');
    }
  }
  
  // タブドラッグ関連ハンドラー
  const handleDragStart = (tabId: string) => {
    setDraggedTab(tabId);
  };
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDropIndex(index);
  };
  
  const handleDragEnd = () => {
    if (draggedTab && dropIndex !== null) {
      // タブの位置を変更
      setTabs(prev => {
        const dragTabIndex = prev.findIndex(t => t.id === draggedTab);
        if (dragTabIndex < 0) return prev;
        
        const newTabs = [...prev];
        const [draggedItem] = newTabs.splice(dragTabIndex, 1);
        newTabs.splice(dropIndex, 0, draggedItem);
        
        return newTabs;
      });
    }
    
    setDraggedTab(null);
    setDropIndex(null);
  };

  // 開発者ツールを実装
  const [showDevTools, setShowDevTools] = useState(false);
  const [devToolsTab, setDevToolsTab] = useState("elements");

  const openDevTools = () => {
    setShowDevTools(!showDevTools);
  };

  // タブを複製する関数
  const duplicateTab = (tabId: string) => {
    const sourceTab = tabs.find(t => t.id === tabId);
    if (!sourceTab) return;
    
    const newTab: Tab = {
      ...sourceTab,
      id: Math.random().toString(36).substr(2, 9),
      isActive: true,
      iframeRef: React.createRef<HTMLIFrameElement>() as MutableRefObject<HTMLIFrameElement | null>,
    };
    
    setTabs(prev => [...prev.map(t => ({ ...t, isActive: false })), newTab]);
  };

  // 他のタブを閉じる関数
  const closeOtherTabs = (tabId: string) => {
    setTabs(prev => {
      const currentTab = prev.find(t => t.id === tabId);
      if (!currentTab) return prev;
      return [{ ...currentTab, isActive: true }];
    });
  };

  // タブをピン留めする関数
  const pinTab = (tabId: string) => {
    // 実装はここでは省略
    console.log('タブをピン留め:', tabId);
  };

  // タブをミュートする関数
  const muteTab = (tabId: string) => {
    // 実装はここでは省略
    console.log('タブをミュート:', tabId);
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#f1f3f4] dark:bg-[#202124]">
      <div className="flex-1 flex flex-col min-h-0">
        {/* ブラウザナビゲーションバーとURL入力 */}
        <BrowserNavigation
          onBack={() => handleTabNavigation('back')}
          onForward={() => handleTabNavigation('forward')}
          onRefresh={() => {
            const activeTab = getActiveTab();
            if (activeTab?.iframeRef?.current) {
              try {
                setTabs(prev => prev.map(t => 
                  t.id === activeTab.id ? { ...t, isLoading: true, error: undefined } : t
                ));
                activeTab.iframeRef.current.src = activeTab.iframeRef.current.src;
              } catch (error) {
                console.error('Failed to refresh:', error);
                handleIframeError(activeTab.id, 'ページの更新中にエラーが発生しました');
              }
            }
          }}
          onUrlChange={handleUrlSubmit}
          currentUrl={getActiveTab()?.url || ''}
          onHomeClick={onHomeClick}
          isLoading={getActiveTab()?.isLoading || false}
          canGoBack={canGoBack()}
          canGoForward={canGoForward()}
          securityInfo={{ 
            secure: getActiveTab()?.url.startsWith('https://') || false 
          }}
          onToggleBookmarks={() => setShowBookmarks(!showBookmarks)}
          defaultSearchEngine={defaultSearchEngine}
          onOpenSettings={() => setShowSettings(true)}
          onOpenDownloads={() => setShowDownloads(true)}
          zoom={getActiveTab()?.zoom || 100}
          onZoomChange={(newZoom) => {
            const activeTab = getActiveTab();
            if (activeTab) {
              updateTabZoom(activeTab.id, newZoom);
              try {
                if (activeTab.iframeRef?.current?.contentDocument?.body) {
                  (activeTab.iframeRef.current.contentDocument.body.style as any).zoom = `${newZoom}%`;
                }
              } catch (e) {
                console.error('ズームの適用に失敗しました:', e);
              }
            }
          }}
        />
        
        {/* タブバー - Chrome風 */}
        <div className="flex items-center h-9 bg-[#dee1e6] dark:bg-[#292a2d] px-2">
          <div className="flex-grow flex space-x-1 overflow-x-auto scrollbar-thin">
            {tabs.map((tab, index) => (
              <div
                key={tab.id}
                className={cn(
                  "group relative flex h-8 items-center space-x-1 pr-2 rounded-t-lg cursor-pointer transition-all duration-150 min-w-[180px] max-w-[240px]",
                  tab.isActive 
                    ? "bg-white dark:bg-[#323639] z-10" 
                    : "bg-[#cfd2d7] dark:bg-[#292a2d] hover:bg-[#d5d9df] dark:hover:bg-[#36383b] text-[#5f6368] dark:text-gray-400"
                )}
                onClick={() => activateTab(tab.id)}
                draggable
                onDragStart={() => handleDragStart(tab.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                <TabContextMenu
                  tab={tab}
                  onClose={() => removeTab(tab.id)}
                  onCloseOtherTabs={() => closeOtherTabs(tab.id)}
                  onDuplicate={() => duplicateTab(tab.id)}
                  onReload={() => {
                    setTabs(prev => prev.map(t => 
                      t.id === tab.id ? { ...t, isLoading: true, error: undefined } : t
                    ));
                    if (tab.iframeRef?.current) {
                      tab.iframeRef.current.src = tab.iframeRef.current.src;
                    }
                  }}
                  onMute={() => muteTab(tab.id)}
                  onPin={() => pinTab(tab.id)}
                />
                
                {/* タブの左側のエッジ */}
                <div className={cn(
                  "absolute left-0 top-0 w-[16px] h-8 rounded-tl-lg",
                  tab.isActive ? "bg-white dark:bg-[#323639]" : "bg-[#cfd2d7] dark:bg-[#292a2d] group-hover:bg-[#d5d9df] dark:group-hover:bg-[#36383b]"
                )} />
                
                {/* タブの右側のエッジ */}
                <div className={cn(
                  "absolute right-0 top-0 w-[16px] h-8 rounded-tr-lg",
                  tab.isActive ? "bg-white dark:bg-[#323639]" : "bg-[#cfd2d7] dark:bg-[#292a2d] group-hover:bg-[#d5d9df] dark:group-hover:bg-[#36383b]"
                )} />
                
                {/* タブの内容 */}
                <div className="flex items-center ml-3 z-10 overflow-hidden">
                  {/* ファビコン */}
                  <div className="flex-shrink-0 w-4 h-4 mr-2">
                    {tab.isLoading ? (
                      <div className="h-4 w-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
                    ) : tab.favicon ? (
                      <img
                        src={tab.favicon}
                        alt=""
                        className="w-4 h-4 object-contain"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                    )}
                  </div>
                  
                  {/* タイトル */}
                  <span className="truncate text-sm">
                    {tab.title || 'New Tab'}
                  </span>
                </div>

                {/* 閉じるボタン */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-5 h-5 p-0 rounded-full ml-1 z-10",
                    !tab.isActive && "opacity-0 group-hover:opacity-100"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTab(tab.id);
                  }}
                >
                  <IoClose className="h-3 w-3" />
                </Button>
              </div>
            ))}
            
            {/* 新しいタブボタン */}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 min-w-[32px] rounded-full mt-[1px] hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={addTab}
            >
              <IoAdd className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* ブックマークバー */}
        {showBookmarks && (
          <div className="flex items-center h-8 px-4 bg-white dark:bg-[#323639] overflow-x-auto">
            {bookmarks.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">ブックマークがありません</div>
            ) : (
              bookmarks.map((bookmark, index) => (
                <div
                  key={index}
                  className="flex items-center px-2 py-1 mr-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                  onClick={() => {
                    const activeTab = getActiveTab();
                    if (activeTab) {
                      handleUrlSubmit(bookmark.url);
                    }
                  }}
                >
                  {bookmark.favicon ? (
                    <img src={bookmark.favicon} alt="" className="w-4 h-4 mr-1" />
                  ) : (
                    <div className="w-4 h-4 mr-1 rounded bg-blue-500"></div>
                  )}
                  <span className="truncate max-w-[150px]">{bookmark.title}</span>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* タブコンテンツ */}
        <div className="flex-1 relative bg-white dark:bg-[#323639]">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                "absolute inset-0",
                tab.isActive ? "block" : "hidden"
              )}
            >
              {tab.error ? (
                // Chrome風のエラーページ
                <div className="flex flex-col h-full p-8 bg-[#f7f7f7] dark:bg-[#292a2d]">
                  <div className="flex items-center mb-6">
                    <div className="text-[#5f6368] dark:text-gray-400 text-7xl mr-6">
                      :(
                    </div>
                    <div>
                      <h1 className="text-[#202124] dark:text-white text-2xl font-normal mb-2">
                        このページは表示できません
                      </h1>
                      <p className="text-[#5f6368] dark:text-gray-400 mb-4">
                        {tab.error || '接続が切断されました'}
                      </p>
                      <div className="text-sm text-[#5f6368] dark:text-gray-400">
                        <p>以下をお試しください：</p>
                        <ul className="list-disc ml-5 mt-2 space-y-1">
                          <li>接続を確認する</li>
                          <li>ページを再読み込みする</li>
                          <li>DNSサーバーを確認する</li>
                        </ul>
                      </div>
                      <div className="mt-6">
                        <code className="text-xs text-[#5f6368] dark:text-gray-400 bg-[#f1f3f4] dark:bg-[#3c4043] px-2 py-1 rounded">
                          ERR_CONNECTION_FAILED
                        </code>
                      </div>
                      <Button
                        variant="outline"
                        className="mt-6 bg-[#1a73e8] hover:bg-[#1a73e8]/90 text-white hover:text-white border-none"
                        onClick={() => {
                          setTabs(prev => prev.map(t => 
                            t.id === tab.id ? { ...t, error: undefined } : t
                          ));
                          handleUrlSubmit(tab.url);
                        }}
                      >
                        再読み込み
                      </Button>
                    </div>
                  </div>
                  <div className="mt-auto text-xs text-[#5f6368] dark:text-gray-500">
                    {tab.url}
                  </div>
                </div>
              ) : (
                <iframe
                  ref={tab.iframeRef}
                  src={`/api/proxy/${tab.url.replace(/^https?:\/\//, '')}`}
                  className="w-full h-full border-0"
                  onLoad={() => handleIframeLoad(tab.id)}
                  onError={() => handleIframeError(tab.id, 'ページの読み込みに失敗しました')}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* 設定パネル */}
      {showSettings && (
        <div className="absolute inset-0 bg-white dark:bg-[#323639] z-50 p-6 overflow-auto">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">ブラウザ設定</h2>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setShowSettings(false)}
              >
                <IoClose className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-8">
              {/* 検索エンジン設定 */}
              <div>
                <h3 className="text-lg font-medium mb-4">検索エンジン</h3>
                <div className="grid gap-2">
                  {searchEngines.map((engine) => (
                    <div 
                      key={engine.name}
                      className={cn(
                        "flex items-center p-3 rounded-lg cursor-pointer",
                        defaultSearchEngine.name === engine.name 
                          ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" 
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                      onClick={() => {
                        setDefaultSearchEngine(engine);
                        localStorage.setItem('default_search_engine', engine.name);
                      }}
                    >
                      <div className="w-5 h-5 flex items-center justify-center mr-3">
                        {defaultSearchEngine.name === engine.name && (
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                      <span>{engine.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* プライバシー設定 */}
              <div>
                <h3 className="text-lg font-medium mb-4">プライバシーとセキュリティ</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>閲覧履歴を保存</span>
                    <Button variant="outline">クリア</Button>
                  </div>
                </div>
              </div>
              
              {/* 統計情報 */}
              <div>
                <h3 className="text-lg font-medium mb-4">統計情報</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">閲覧したページ数</div>
                    <div className="text-2xl font-semibold">{stats.pagesVisited}</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">ブロックしたコンテンツ</div>
                    <div className="text-2xl font-semibold">{stats.blockedContent}</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">ダウンロード数</div>
                    <div className="text-2xl font-semibold">{stats.downloads}</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">ブラウザ使用時間</div>
                    <div className="text-2xl font-semibold">{Math.floor(stats.timeSpent / 60)}分</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* ダウンロードパネル */}
      {showDownloads && (
        <div className="absolute bottom-0 right-0 w-80 h-96 bg-white dark:bg-[#323639] shadow-lg rounded-t-lg overflow-hidden z-30">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-medium">ダウンロード</h3>
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 p-0"
              onClick={() => setShowDownloads(false)}
            >
              <IoClose className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-4">
            {stats.downloads === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                ダウンロードはありません
              </div>
            ) : (
              <div className="text-center">
                {stats.downloads}個のファイルがダウンロードされました
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 開発者ツール */}
      {showDevTools && (
        <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-white dark:bg-[#202124] shadow-lg border-t border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden z-30">
          {/* 開発者ツールのヘッダー */}
          <div className="flex items-center h-10 px-4 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-[#292a2d]">
            <div className="flex space-x-1">
              <button 
                className={`px-3 py-1 text-sm ${devToolsTab === 'elements' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                onClick={() => setDevToolsTab('elements')}
              >
                Elements
              </button>
              <button 
                className={`px-3 py-1 text-sm ${devToolsTab === 'console' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                onClick={() => setDevToolsTab('console')}
              >
                Console
              </button>
              <button 
                className={`px-3 py-1 text-sm ${devToolsTab === 'network' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                onClick={() => setDevToolsTab('network')}
              >
                Network
              </button>
              <button 
                className={`px-3 py-1 text-sm ${devToolsTab === 'application' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                onClick={() => setDevToolsTab('application')}
              >
                Application
              </button>
            </div>
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowDevTools(false)}
              >
                <IoClose className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* 開発者ツールのコンテンツ */}
          <div className="flex-1 overflow-auto p-2">
            {devToolsTab === 'elements' && (
              <div className="font-mono text-sm">
                <p>&lt;!DOCTYPE html&gt;</p>
                <p>&lt;html lang="en"&gt;</p>
                <p className="ml-4">&lt;head&gt;</p>
                <p className="ml-8">&lt;meta charset="UTF-8"&gt;</p>
                <p className="ml-8">&lt;meta name="viewport" content="width=device-width, initial-scale=1.0"&gt;</p>
                <p className="ml-8">&lt;title&gt;{getActiveTab()?.title || 'Document'}&lt;/title&gt;</p>
                <p className="ml-4">&lt;/head&gt;</p>
                <p className="ml-4">&lt;body&gt;</p>
                <p className="ml-8">&lt;div id="root"&gt;...&lt;/div&gt;</p>
                <p className="ml-4">&lt;/body&gt;</p>
                <p>&lt;/html&gt;</p>
              </div>
            )}
            
            {devToolsTab === 'console' && (
              <div className="font-mono text-sm">
                <p className="text-gray-500">Console is clear. Try running some JavaScript.</p>
                <div className="mt-2 flex items-center border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-gray-500 mr-2">&gt;</span>
                  <input 
                    type="text" 
                    className="flex-1 bg-transparent border-none focus:ring-0" 
                    placeholder="console.log('Hello World')"
                  />
                </div>
              </div>
            )}
            
            {devToolsTab === 'network' && (
              <div className="font-mono text-sm">
                <p className="text-gray-500">Recording network activity...</p>
                <p className="text-gray-500">Perform a request or reload to record.</p>
                <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Type</th>
                        <th className="px-4 py-2">Size</th>
                        <th className="px-4 py-2">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-2 text-blue-500">{getActiveTab()?.url || ''}</td>
                        <td className="px-4 py-2">200</td>
                        <td className="px-4 py-2">document</td>
                        <td className="px-4 py-2">15.2 KB</td>
                        <td className="px-4 py-2">123 ms</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {devToolsTab === 'application' && (
              <div className="font-mono text-sm">
                <p className="text-gray-500">Local Storage:</p>
                <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-2">Key</th>
                        <th className="px-4 py-2">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-2">browser_tabs</td>
                        <td className="px-4 py-2">[Object]</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">browser_bookmarks</td>
                        <td className="px-4 py-2">[Array]</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ユーザー設定コンポーネント
const SettingsComponent: React.FC = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">設定</h2>
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">プロフィール</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">ユーザー名</label>
              <Input defaultValue="ユーザー名" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">メールアドレス</label>
              <Input defaultValue="example@example.com" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium">表示設定</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">ダークモード</label>
              <Button variant="outline" size="sm">切り替え</Button>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">言語</label>
              <Button variant="outline" size="sm">日本語</Button>
            </div>
          </div>
        </div>
        <Button>変更を保存</Button>
      </div>
    </div>
  )
}

// 通知コンポーネント
const NotificationsComponent: React.FC = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">通知</h2>
      <div className="space-y-4">
        <div className="p-3 border rounded-lg">
          <p className="font-medium">新しいメッセージがあります</p>
          <p className="text-sm text-muted-foreground">3分前</p>
        </div>
        <div className="p-3 border rounded-lg">
          <p className="font-medium">システムメンテナンスのお知らせ</p>
          <p className="text-sm text-muted-foreground">1時間前</p>
        </div>
      </div>
    </div>
  )
}

// フレンドコンポーネント
const FriendsComponent: React.FC = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">フレンド</h2>
      <div className="space-y-4">
        <div className="p-3 border rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 mr-3"></div>
            <div>
              <p className="font-medium">ユーザー1</p>
              <p className="text-sm text-muted-foreground">オンライン</p>
            </div>
          </div>
          <Button variant="outline" size="sm">メッセージ</Button>
        </div>
        <div className="p-3 border rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 mr-3"></div>
            <div>
              <p className="font-medium">ユーザー2</p>
              <p className="text-sm text-muted-foreground">オフライン</p>
            </div>
          </div>
          <Button variant="outline" size="sm">メッセージ</Button>
        </div>
      </div>
    </div>
  )
}

// チャットコンポーネント
const ChatComponent: React.FC = () => {
  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">チャット</h2>
      <div className="flex-1 border rounded-lg p-4 overflow-y-auto mb-4 space-y-4">
        <div className="flex items-start">
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 mr-2"></div>
          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg max-w-[80%]">
            <p>こんにちは！</p>
            <p className="text-xs text-gray-500 mt-1">10:30</p>
          </div>
        </div>
        <div className="flex items-start flex-row-reverse">
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 ml-2"></div>
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg max-w-[80%]">
            <p>元気ですか？</p>
            <p className="text-xs text-gray-500 mt-1">10:32</p>
          </div>
        </div>
      </div>
      <div className="flex">
        <Input className="flex-1 mr-2" placeholder="メッセージを入力..." />
        <Button>送信</Button>
      </div>
    </div>
  )
}

// ブックマークコンポーネント
const BookmarksComponent: React.FC = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">ブックマーク</h2>
      <div className="space-y-4">
        <div className="p-3 border rounded-lg flex items-center justify-between">
          <div>
            <p className="font-medium">Google</p>
            <p className="text-sm text-muted-foreground">https://www.google.com</p>
          </div>
          <Button variant="outline" size="sm">開く</Button>
        </div>
        <div className="p-3 border rounded-lg flex items-center justify-between">
          <div>
            <p className="font-medium">YouTube</p>
            <p className="text-sm text-muted-foreground">https://www.youtube.com</p>
          </div>
          <Button variant="outline" size="sm">開く</Button>
        </div>
      </div>
    </div>
  )
}

// ContextMenu コンポーネントの追加
const TabContextMenu: React.FC<{
  tab: Tab;
  onClose: () => void;
  onCloseOtherTabs: () => void;
  onDuplicate: () => void;
  onReload: () => void;
  onMute: () => void;
  onPin: () => void;
}> = ({ tab, onClose, onCloseOtherTabs, onDuplicate, onReload, onMute, onPin }) => {
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPosition({ x: e.clientX, y: e.clientY });
  };
  
  const handleClose = () => {
    setMenuPosition(null);
  };
  
  // コンテキストメニュー以外をクリックした場合に閉じる
  useEffect(() => {
    if (!menuPosition) return;
    
    const handleClickOutside = () => {
      setMenuPosition(null);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuPosition]);
  
  return (
    <>
      <div className="absolute inset-0 z-10" onContextMenu={handleContextMenu} />
      {menuPosition && (
        <div
          className="fixed z-50 bg-white dark:bg-[#202124] shadow-lg rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 py-1 w-56"
          style={{ left: menuPosition.x, top: menuPosition.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" onClick={() => { onReload(); handleClose(); }}>
            再読み込み
          </div>
          <div className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" onClick={() => { onDuplicate(); handleClose(); }}>
            タブを複製
          </div>
          <div className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" onClick={() => { onPin(); handleClose(); }}>
            タブをピン留め
          </div>
          <div className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" onClick={() => { onMute(); handleClose(); }}>
            タブをミュート
          </div>
          <hr className="my-1 border-gray-200 dark:border-gray-700" />
          <div className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" onClick={() => { onClose(); handleClose(); }}>
            タブを閉じる
          </div>
          <div className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" onClick={() => { onCloseOtherTabs(); handleClose(); }}>
            他のタブを閉じる
          </div>
        </div>
      )}
    </>
  );
};

export default function HomePage() {
  const { data: session, status } = useSession()
  const { activeView, setActiveView } = useNavigationStore()

  // 管理者統計データの取得
  const { data: adminStats } = useQuery<AdminStats>({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) {
        throw new Error('Failed to fetch admin stats')
      }
      return res.json()
    },
    enabled: !!session?.user?.role && ["super_admin", "admin"].includes(session.user.role as string),
    retry: 1
  })

  // セッションの状態を監視
  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      console.log("未認証状態です")
      return
    }
    console.log("認証済み:", session.user)
  }, [session, status])

  // ローディング中
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">読み込み中...</p>
        </div>
      </div>
    )
  }

  // セッションが無効な場合はログインフォームを表示
  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoginForm />
      </div>
    )
  }

  // メインコンテンツの表示
  const renderContent = () => {
    console.log('レンダリング中のビュー:', activeView)
    switch (activeView) {
      case 'admin-overview':
        return (
          <AdminDashboard 
            stats={adminStats || {
              totalUsers: 0,
              activeUsers: 0,
              totalServers: 0,
              totalMessages: 0,
              monthlyActiveUsers: []
            }}
            onHomeClick={() => setActiveView('dashboard')}
          />
        )
      case 'admin-users':
        return <UserManagementSection />
      case 'admin-servers':
        return <ServerMonitoringSection />
      case 'admin-messages':
        return <div>メッセージ管理</div>
      case 'admin-announcements':
        return <div>お知らせ管理</div>
      case 'admin-security':
        return <SecuritySection />
      case 'admin-audit-logs':
        return <div>監査ログ</div>
      case 'admin-bans':
        return <div>BAN管理</div>
      case 'admin-settings':
        return <SettingsSection />
      case 'friends':
        return <FriendsComponent />
      case 'chat':
        return <ChatComponent />
      case 'notifications':
        return <NotificationsComponent />
      case 'browser':
        return (
          <div className="w-full h-full">
            <BrowserComponent onHomeClick={() => setActiveView('dashboard')} />
          </div>
        )
      case 'bookmarks':
        return <BookmarksComponent />
      case 'settings':
        return <SettingsComponent />
      case 'dashboard':
      default:
        return <UserDashboard isAdmin={["super_admin", "admin"].includes(session.user?.role as string)} />
    }
  }

  // 管理者ページのレイアウト
  if (activeView.startsWith('admin-')) {
    return (
      <div className="flex">
        <AdminNav />
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    )
  }

  // 一般ユーザーのダッシュボード
  return renderContent()
} 