'use client';

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Globe, Settings, Shield, Clock } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface UserDashboardProps {
  onBrowserOpen: () => void;
  onSettingsOpen: () => void;
  onChatOpen: () => void;
  onFriendsOpen: () => void;
  onAdminOpen?: () => void;
  isAdmin?: boolean;
}

export function UserDashboard({
  onBrowserOpen,
  onSettingsOpen,
  onChatOpen,
  onFriendsOpen,
  onAdminOpen,
  isAdmin = false
}: UserDashboardProps) {
  const [usageTime, setUsageTime] = useState(0);

  useEffect(() => {
    console.log('UserDashboard mounted', { isAdmin, onAdminOpen });
  }, [isAdmin, onAdminOpen]);

  useEffect(() => {
    // セッション開始時刻を保存
    const startTime = localStorage.getItem('sessionStartTime') || Date.now().toString();
    localStorage.setItem('sessionStartTime', startTime);

    // 1分ごとに利用時間を更新
    const timer = setInterval(() => {
      const currentTime = Date.now();
      const sessionStart = parseInt(startTime);
      const minutesUsed = Math.floor((currentTime - sessionStart) / (1000 * 60));
      setUsageTime(minutesUsed);
    }, 60000);

    // 初回実行
    const currentTime = Date.now();
    const sessionStart = parseInt(startTime);
    const minutesUsed = Math.floor((currentTime - sessionStart) / (1000 * 60));
    setUsageTime(minutesUsed);

    return () => clearInterval(timer);
  }, []);

  const handleChatOpen = useDebounce(onChatOpen);
  const handleFriendsOpen = useDebounce(onFriendsOpen);
  const handleBrowserOpen = useDebounce(onBrowserOpen);
  const handleSettingsOpen = useDebounce(onSettingsOpen);

  const handleAdminOpen = () => {
    console.log('管理者ボタンがクリックされました', { isAdmin, onAdminOpen });
    if (isAdmin && onAdminOpen) {
      onAdminOpen();
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">
            マイダッシュボード
          </h2>
          <p className="text-muted-foreground">
            今日も素晴らしい一日になりますように！
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground">
            本日の利用時間: {Math.floor(usageTime / 60)}時間 {usageTime % 60}分
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <Card className="p-4 bg-card hover:bg-card/80">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5" />
            <h2 className="font-semibold">チャットを始める</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">友達とメッセージを交換</p>
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={handleChatOpen}
          >
            開く
          </Button>
        </Card>

        <Card className="p-4 bg-card hover:bg-card/80">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5" />
            <h2 className="font-semibold">フレンド</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">フレンドリストを確認</p>
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={handleFriendsOpen}
          >
            開く
          </Button>
        </Card>

        <Card className="p-4 bg-card hover:bg-card/80">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5" />
            <h2 className="font-semibold">ブラウザを開く</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">安全なブラウジングを開始</p>
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={handleBrowserOpen}
          >
            開く
          </Button>
        </Card>

        <Card className="p-4 bg-card hover:bg-card/80">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-5 h-5" />
            <h2 className="font-semibold">設定</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">アカウント設定を変更</p>
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={handleSettingsOpen}
          >
            開く
          </Button>
        </Card>

        {isAdmin && (
          <Card className="p-4 bg-card hover:bg-card/80">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5" />
              <h2 className="font-semibold">管理者ダッシュボード</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">システム管理と監視</p>
            <Button 
              variant="primary" 
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
              onClick={handleAdminOpen}
            >
              開く
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
} 