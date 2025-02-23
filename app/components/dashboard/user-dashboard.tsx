'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Globe, Settings, Shield, UserCircle } from "lucide-react";

interface UserDashboardProps {
  onChatOpen: () => void;
  onFriendsOpen: () => void;
  onBrowserOpen: () => void;
  onSettingsOpen: () => void;
  onAdminOpen?: () => void;
  isAdmin?: boolean;
}

export function UserDashboard({ 
  onChatOpen, 
  onFriendsOpen, 
  onBrowserOpen, 
  onSettingsOpen,
  onAdminOpen,
  isAdmin = false
}: UserDashboardProps) {
  return (
    <div className="space-y-4 p-4">
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
            onClick={onChatOpen}
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
            onClick={onFriendsOpen}
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
            onClick={onBrowserOpen}
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
            onClick={onSettingsOpen}
          >
            開く
          </Button>
        </Card>

        {isAdmin && onAdminOpen && (
          <Card className="p-4 bg-card hover:bg-card/80">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5" />
              <h2 className="font-semibold">管理者ダッシュボード</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">システム管理と監視</p>
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={onAdminOpen}
            >
              開く
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
} 