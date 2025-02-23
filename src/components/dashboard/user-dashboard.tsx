"use client"

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation';
import { 
  ClockIcon, 
  ActivityIcon, 
  SettingsIcon, 
  GlobeIcon,
  MessageSquare,
  Users,
  Shield
} from "lucide-react"
import { AnnouncementsSection } from "@/components/dashboard/announcements-section"

const DAILY_MESSAGES = [
  "今日も素晴らしい一日になりますように！",
  "新しい発見があるかもしれません",
  "今日はどんな発見があるでしょうか",
  "安全なブラウジングを心がけましょう",
  "新しい知識を得る機会を探しましょう",
  "インターネットを賢く活用しましょう",
]

interface UserDashboardProps {
  onBrowserOpen: () => void;
  onSettingsOpen: () => void;
  onChatOpen: () => void;
  onFriendsOpen: () => void;
  onAdminOpen?: () => void;
  isAdmin?: boolean;
}

interface DashboardStats {
  usageTime: number;
  visitedSites: number;
  downloads: number;
  lastActivity: string;
}

interface ExtendedSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
  accessToken: string;
  expires: string;
}

export function UserDashboard({
  onBrowserOpen,
  onSettingsOpen,
  onChatOpen,
  onFriendsOpen,
  onAdminOpen,
  isAdmin: initialIsAdmin = false
}: UserDashboardProps) {
  const router = useRouter();
  const { data: session, status } = useSession() as { data: ExtendedSession | null, status: string }
  const [usageTime, setUsageTime] = useState(0)
  const [dailyMessage, setDailyMessage] = useState(DAILY_MESSAGES[Math.floor(Math.random() * DAILY_MESSAGES.length)])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin)

  const dummyStats: DashboardStats = {
    usageTime: 120,
    visitedSites: 10,
    downloads: 5,
    lastActivity: new Date().toISOString()
  };

  const handleSessionError = useCallback(async (error: string) => {
    console.error('Session error:', error);
    setError(error);
    toast.error(error);
    
    // セッションをクリア
    await signOut({ redirect: false });
    
    // ローカルストレージをクリア
    localStorage.removeItem('user-preferences');
    localStorage.removeItem('last-session');
    
    // ログインページにリダイレクト
    router.push('/login');
  }, [router]);

  const validateSession = useCallback(() => {
    if (!session) {
      handleSessionError('セッションが見つかりません。再度ログインしてください。');
      return false;
    }

    if (!session.accessToken) {
      handleSessionError('アクセストークンが無効です。再度ログインしてください。');
      return false;
    }

    if (!session.user?.id) {
      handleSessionError('ユーザー情報が見つかりません。再度ログインしてください。');
      return false;
    }

    const sessionExpiry = new Date(session.expires);
    if (sessionExpiry < new Date()) {
      handleSessionError('セッションの有効期限が切れました。再度ログインしてください。');
      return false;
    }

    return true;
  }, [session, handleSessionError]);

  useEffect(() => {
    console.log('Session status:', status);
    console.log('Session data:', session);

    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      handleSessionError('認証が必要です。ログインページに移動します。');
      return;
    }

    if (!validateSession()) {
      return;
    }

    // セッションが有効な場合の処理
    if (session.user.role === 'super_admin' && !isAdmin) {
      setIsAdmin(true);
    }

    loadDashboard();

    // セッション有効期限の監視
    const checkSessionExpiry = () => {
      if (!session || !session.expires) return;  // セッションまたはexpiresが存在しない場合は早期リターン
      
      const expiryTime = new Date(session.expires);
      const timeUntilExpiry = expiryTime.getTime() - new Date().getTime();
      
      if (timeUntilExpiry <= 0) {
        handleSessionError('セッションの有効期限が切れました。再度ログインしてください。');
      } else if (timeUntilExpiry <= 300000) { // 5分前
        toast('セッションの有効期限が近づいています。作業内容を保存してください。', {
          duration: 5000,
          icon: '⚠️',
          style: {
            background: '#fff3cd',
            color: '#856404',
            border: '1px solid #ffeeba'
          }
        });
      }
    };

    const sessionCheckInterval = setInterval(checkSessionExpiry, 60000); // 1分ごとにチェック

    return () => {
      clearInterval(sessionCheckInterval);
    };
  }, [status, session, validateSession, handleSessionError, isAdmin]);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!validateSession()) {
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Using dummy data in development mode');
        setTimeout(() => {
          setStats(dummyStats);
          setIsLoading(false);
        }, 1000);
        return;
      }

      console.log('Fetching dashboard stats...');
      const response = await fetch('/api/dashboard/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken || ''}`,
          'X-User-Role': session?.user?.role || 'user'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Dashboard API error:', response.status, errorData);
        
        if (response.status === 401) {
          toast.error('認証が必要です');
          router.push('/login');
          return;
        }
        
        throw new Error(errorData || '統計データの取得に失敗しました');
      }

      const data = await response.json();
      console.log('Dashboard data received:', data);
      setStats(data);
    } catch (err) {
      console.error('Dashboard error:', err);
      const errorMessage = err instanceof Error ? err.message : '予期せぬエラーが発生しました';
      
      if (errorMessage.includes('セッション') || errorMessage.includes('認証')) {
        handleSessionError(errorMessage);
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Using dummy data after error in development mode');
        setStats(dummyStats);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner />
        <p className="ml-2 text-zinc-400">セッションを確認中...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner />
        <p className="ml-2 text-zinc-400">データを読み込んでいます...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    console.log('Rendering unauthenticated state');
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 mb-4">認証が必要です</p>
        <Button onClick={() => router.push('/login')}>
          ログインする
        </Button>
      </div>
    );
  }

  if (!session?.user?.id) {
    console.log('Rendering no session state');
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 mb-4">セッションが無効です</p>
        <Button onClick={() => router.push('/login')}>
          再ログイン
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 mb-4">{error}</p>
        <Button
          onClick={loadDashboard}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          再試行
        </Button>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-zinc-400 mb-4">データを読み込んでいます...</p>
        <LoadingSpinner />
      </div>
    );
  }

  const { usageTime: statsUsageTime, visitedSites, downloads, lastActivity } = stats;

  return (
    <div className="p-8 space-y-8 bg-[#0f0f10]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">
            マイダッシュボード
          </h2>
          <p className="text-zinc-400">
            ようこそ、{session?.user?.name}さん
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <ActivityIcon className="h-4 w-4" />
          <span>ステータス:</span>
          <span className="text-green-500">オンライン</span>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-zinc-200">{dailyMessage}</CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-1">
          <Card className="bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-pink-500/5">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-zinc-200">お知らせ</CardTitle>
            </CardHeader>
            <CardContent>
              <AnnouncementsSection />
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium text-zinc-200">本日の利用時間</CardTitle>
            <ClockIcon className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-center py-4 text-zinc-200">
              {Math.floor(statsUsageTime / 60)}時間 {statsUsageTime % 60}分
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2.5 rounded-full"
                style={{ width: `${(statsUsageTime / (24 * 60)) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:bg-zinc-900/50 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-200">チャットを開く</CardTitle>
            <MessageSquare className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400 mb-4">友達とメッセージを交換</p>
            <Button 
              variant="outline"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0"
              onClick={onChatOpen}
            >
              開く
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:bg-zinc-900/50 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-200">フレンド</CardTitle>
            <Users className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400 mb-4">フレンドリストを確認</p>
            <Button 
              variant="outline"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0"
              onClick={onFriendsOpen}
            >
              開く
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:bg-zinc-900/50 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-200">ブラウザを開く</CardTitle>
            <GlobeIcon className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400 mb-4">安全なブラウジングを開始</p>
            <Button 
              variant="outline"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0"
              onClick={onBrowserOpen}
            >
              開く
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:bg-zinc-900/50 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-200">設定</CardTitle>
            <SettingsIcon className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400 mb-4">アカウント設定を変更</p>
            <Button 
              variant="outline"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0"
              onClick={onSettingsOpen}
            >
              開く
            </Button>
          </CardContent>
        </Card>

        {isAdmin && onAdminOpen && (
          <Card className="hover:bg-zinc-900/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-200">管理者パネル</CardTitle>
              <Shield className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400 mb-4">システム管理と監視</p>
              <Button 
                variant="outline"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0"
                onClick={onAdminOpen}
              >
                開く
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 