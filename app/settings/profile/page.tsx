import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProfileForm from '@/components/settings/ProfileForm';

export const metadata = {
  title: 'プロフィール設定 - School Hub',
  description: 'ユーザープロフィールの設定を行います。',
};

async function ProfilePage() {
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
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">プロフィール</h3>
          <p className="text-sm text-muted-foreground">
            あなたのプロフィール情報を管理します。
          </p>
        </div>
        <ProfileForm 
          user={{
            id: user.id,
            name: user.name || '',
            email: user.email,
            image: user.image || '',
          }}
        />
      </div>
    </div>
  );
}

export default ProfilePage; 