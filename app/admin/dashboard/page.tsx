'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from '@/components/admin/UserManagement';
import { SecuritySettings } from '@/components/admin/SecuritySettings';
import { AnnouncementManagement } from '@/components/admin/AnnouncementManagement';
import { AuditLogs } from '@/components/admin/AuditLogs';
import { SystemMonitoring } from '@/components/admin/SystemMonitoring';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
    if (session?.user?.role !== 'admin') {
      redirect('/dashboard');
    }
  }, [session, status]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">管理者ダッシュボード</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users">ユーザー管理</TabsTrigger>
          <TabsTrigger value="security">セキュリティ</TabsTrigger>
          <TabsTrigger value="announcements">お知らせ</TabsTrigger>
          <TabsTrigger value="audit">監査ログ</TabsTrigger>
          <TabsTrigger value="monitoring">システム監視</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>ユーザー管理</CardTitle>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>セキュリティ設定</CardTitle>
            </CardHeader>
            <CardContent>
              <SecuritySettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle>お知らせ管理</CardTitle>
            </CardHeader>
            <CardContent>
              <AnnouncementManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>監査ログ</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditLogs />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>システム監視</CardTitle>
            </CardHeader>
            <CardContent>
              <SystemMonitoring />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 