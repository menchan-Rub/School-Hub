import { useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useToast } from '@/components/ui/use-toast';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
}

export function UserManagementSection() {
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    const handleStatusChange = async (userId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) throw new Error('ステータスの更新に失敗しました');

            setUsers(users.map(user => 
                user.id === userId ? { ...user, status: newStatus } : user
            ));

            toast({
                title: 'ステータスを更新しました',
                description: `ユーザーのステータスを${newStatus}に変更しました。`,
            });
        } catch (error) {
            toast({
                title: 'エラー',
                description: 'ステータスの更新に失敗しました。',
                variant: 'destructive',
            });
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: newRole }),
            });

            if (!response.ok) throw new Error('権限の更新に失敗しました');

            setUsers(users.map(user => 
                user.id === userId ? { ...user, role: newRole } : user
            ));

            toast({
                title: '権限を更新しました',
                description: `ユーザーの権限を${newRole}に変更しました。`,
            });
        } catch (error) {
            toast({
                title: 'エラー',
                description: '権限の更新に失敗しました。',
                variant: 'destructive',
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>ユーザー管理</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Input
                            placeholder="ユーザーを検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="max-w-sm"
                        />
                        <Button variant="outline">
                            新規ユーザー
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {users.map(user => (
                            <div
                                key={user.id}
                                className="flex items-center justify-between p-4 rounded-lg bg-secondary/10"
                            >
                                <div className="flex items-center gap-4">
                                    <UserAvatar
                                        user={{ name: user.name, image: undefined }}
                                        fallback={user.name[0]}
                                    />
                                    <div>
                                        <p className="font-medium">{user.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Badge
                                        variant={user.status === 'active' ? 'default' : 'secondary'}
                                    >
                                        {user.status}
                                    </Badge>
                                    <Badge
                                        variant={user.role === 'admin' ? 'destructive' : 'outline'}
                                    >
                                        {user.role}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleStatusChange(user.id, user.status === 'active' ? 'inactive' : 'active')}
                                    >
                                        {user.status === 'active' ? '無効化' : '有効化'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 