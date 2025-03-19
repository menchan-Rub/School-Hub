import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PasswordChangeForm from '@/components/settings/PasswordChangeForm';
import TwoFactorAuthForm from '@/components/settings/TwoFactorAuthForm';

export const metadata = {
  title: 'セキュリティ設定 - School Hub',
  description: 'アカウントのセキュリティ設定を行います。',
};

async function SecurityPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/');
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });
  
  if (!user) {
    redirect('/');
  }
  
  return (
    <div className="container mx-auto py-10">
      <div className="space-y-10">
        <div>
          <h3 className="text-lg font-medium">セキュリティ設定</h3>
          <p className="text-sm text-muted-foreground">
            アカウントのセキュリティ設定を管理します。
          </p>
        </div>
        
        <div className="space-y-8">
          <div className="space-y-4">
            <h4 className="text-md font-medium">パスワード変更</h4>
            <PasswordChangeForm userId={user.id} />
          </div>
          
          <div className="space-y-4">
            <h4 className="text-md font-medium">二段階認証</h4>
            <p className="text-sm text-muted-foreground">
              アカウントの安全性を高めるために二段階認証を設定することをお勧めします。
            </p>
            <TwoFactorAuthForm userId={user.id} />
          </div>
          
          <div className="space-y-4">
            <h4 className="text-md font-medium">ログインセッション</h4>
            <p className="text-sm text-muted-foreground">
              アクティブなログインセッションを管理します。不審なセッションがある場合は、すぐにセッションを終了してください。
            </p>
            <div className="p-4 border rounded-md">
              <p className="text-sm">現在のセッション: {new Date().toLocaleDateString('ja-JP')}</p>
              <p className="text-xs text-muted-foreground">IP: 127.0.0.1</p>
              <p className="text-xs text-muted-foreground">デバイス: Web ブラウザ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecurityPage; 